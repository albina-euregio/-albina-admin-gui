import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { SettingsService } from "../settings-service/settings.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { WsBulletinService } from "../ws-bulletin-service/ws-bulletin.service";
import { WsRegionService } from "../ws-region-service/ws-region.service";
import { RegionLockModel } from "../../models/region-lock.model";
import { BulletinLockModel } from "../../models/bulletin-lock.model";
import { ServerModel } from "../../models/server.model";
import * as Enums from "../../enums/enums";

@Injectable()
export class BulletinsService {

  private activeDate: Date;
  private copyDate: Date;
  private isEditable: boolean;
  private isUpdate: boolean;

  public lockedRegions: Map<string, Date[]>;
  public regionLocks: Subject<RegionLockModel>;
  public lockedBulletins: Map<string, string>;
  public bulletinLocks: Subject<BulletinLockModel>;

  public statusMap: Map<string, Map<number, Enums.BulletinStatus>>;

  public dates: Date[];

  constructor(
    public http: HttpClient,
    private constantsService: ConstantsService,
    private authenticationService: AuthenticationService,
    private settingsService: SettingsService,
    private wsBulletinService: WsBulletinService,
    private wsRegionService: WsRegionService) {
    this.init();
  }

  init() {
    this.dates = new Array<Date>();
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.isUpdate = false;

    this.statusMap = new Map<string, Map<number, Enums.BulletinStatus>>();

    this.lockedRegions = new Map<string, Date[]>();
    this.lockedBulletins = new Map<string, string>();

    // connect to websockets
    this.wsRegionConnect();
    this.wsBulletinConnect();

    this.getLockedRegions(this.authenticationService.getActiveRegionId()).subscribe(
      data => {
        for (const lockedDate of (data as any)) {
          const date = new Date(lockedDate);
          this.addLockedRegion(this.authenticationService.getActiveRegionId(), date);
        }
      },
      () => {
        console.warn("Locked regions could not be loaded!");
      }
    );

    /*
      this.getLockedBulletins().subscribe(
        data => {
        },
        error => {
        console.warn("Locked bulletins could not be loaded!");
        }
      );
    */

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 10; i++) {
      const date = new Date(endDate.valueOf());
      date.setDate(endDate.getDate() - i);
      date.setHours(0, 0, 0, 0);
      this.dates.push(date);
    }

    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      data => {
        let map = new Map<number, Enums.BulletinStatus>();
        for (let i = (data as any).length - 1; i >= 0; i--) {
          map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
        }
        this.statusMap.set(this.authenticationService.getActiveRegionId(), map);
      },
      () => {
        console.error("Status {} could not be loaded!", this.authenticationService.getActiveRegionId());
      }
    );
    this.authenticationService.getActiveRegion().neighborRegions.forEach(neighborRegion => {
      this.getStatus(neighborRegion, startDate, endDate).subscribe(
        data => {
          let map = new Map<number, Enums.BulletinStatus>();
          for (let i = (data as any).length - 1; i >= 0; i--) {
            map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
          }
          this.statusMap.set(neighborRegion, map);
        },
        () => {
          console.error("Status {} could not be loaded!", neighborRegion);
        }
      );
    });
  }

  public wsRegionConnect() {
    this.regionLocks = <Subject<RegionLockModel>>this.wsRegionService
      .connect(this.constantsService.getWsRegionUrl() + this.authenticationService.getUsername())
      .pipe(map((response: any): RegionLockModel => {
        const data = JSON.parse(response.data);
        const regionLock = RegionLockModel.createFromJson(data);
        if (regionLock.getLock()) {
          console.debug("Region lock received: " + regionLock.getDate().toLocaleDateString() + " - " + regionLock.getRegion() + " [" + regionLock.getUsername() + "]");
          this.addLockedRegion(regionLock.getRegion(), regionLock.getDate());
        } else {
          console.debug("Region unlock received: " + regionLock.getDate().toLocaleDateString() + " - " + regionLock.getRegion() + " [" + regionLock.getUsername() + "]");
          this.removeLockedRegion(regionLock.getRegion(), regionLock.getDate());
        }
        return regionLock;
      }));

    this.regionLocks.subscribe(() => {
    });
  }

  public wsRegionDisconnect() {
    this.wsRegionService.disconnect();
  }

  public wsBulletinConnect() {
    this.bulletinLocks = <Subject<BulletinLockModel>>this.wsBulletinService
      .connect(this.constantsService.getWsBulletinUrl() + this.authenticationService.getUsername())
      .pipe(map((response: any): BulletinLockModel => {
        const data = JSON.parse(response.data);
        const bulletinLock = BulletinLockModel.createFromJson(data);
        if (bulletinLock.getLock()) {
          console.debug("Bulletin lock received: " + bulletinLock.getBulletin());
          this.addLockedBulletin(bulletinLock.getBulletin(), bulletinLock.getUsername());
        } else {
          console.debug("Bulletin unlock received: " + bulletinLock.getBulletin());
          this.removeLockedBulletin(bulletinLock.getBulletin());
        }
        return bulletinLock;
      }));

    this.bulletinLocks.subscribe(() => {
    });
  }

  public wsBulletinDisconnect() {
    this.wsBulletinService.disconnect();
  }

  getActiveDate(): Date {
    return this.activeDate;
  }

  setActiveDate(date: Date) {
    this.activeDate = date;
  }

  /**
   * Returns a date that's offset from the activeDate by a given amount.
   * 
   * @param offset - Number of days to offset. Can be positive (future) or negative (past).
   * @returns Date offset from the activeDate or null if not found or out of bounds.
   */
  private getDateOffset(offset: number): Date | null {
    if (!this.activeDate) {
        return null;
    }

    const index = this.dates.findIndex(d => d.getTime() === this.activeDate.getTime());

    if (index === -1 || index + offset < 0 || index + offset >= this.dates.length) {
        return null;
    }

    return this.dates[index + offset];
  }

  getNextDate(): Date | null {
    return this.getDateOffset(1);
  }

  getPreviousDate(): Date | null {
    return this.getDateOffset(-1);
  }

  getCopyDate(): Date {
    return this.copyDate;
  }

  setCopyDate(date: Date) {
    this.copyDate = date;
  }

  getIsEditable(): boolean {
    return this.isEditable;
  }

  setIsEditable(isEditable: boolean) {
    this.isEditable = isEditable;
  }

  getIsUpdate() {
    return this.isUpdate;
  }

  setIsUpdate(isUpdate: boolean) {
    this.isUpdate = isUpdate;
  }

  getUserRegionStatus(date: Date): Enums.BulletinStatus {
    const region = this.authenticationService.getActiveRegionId();
    const regionStatusMap = this.statusMap.get(region);
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  setUserRegionStatus(date: Date, status: Enums.BulletinStatus) {
    const region = this.authenticationService.getActiveRegionId();
    this.statusMap.get(region).set(date.getTime(), status);
  }

  getPreviewPdf(date: Date): Observable<Blob> {
    const url = this.constantsService.getServerUrl() + "bulletins/preview?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId() + "&lang=" + this.settingsService.getLangString();
    const headers = this.authenticationService.newAuthHeader("application/pdf");
    const options = { headers: headers };

    return this.http.get(url, { headers: headers, responseType: "blob" });
  }

  getStatus(region: string, startDate: Date, endDate: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/internal?startDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(startDate) + "&endDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(endDate) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  getPublicationsStatus(region: string, startDate: Date, endDate: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/publications?startDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(startDate) + "&endDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(endDate) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  getPublicationStatus(region: string, date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/publication?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  loadBulletins(date: Date, regions: String[]): Observable<Response> {
    let url = this.constantsService.getServerUrl() + "bulletins/edit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    if (regions) {
      for (const region of regions) {
        url += "&regions=" + region;
      }
    }
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  loadExternalBulletins(date: Date, server: ServerModel): Observable<Response> {
    let url = server.apiUrl + "bulletins/edit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    if (server.regions) {
      for (const region of server.regions) {
        // region
        // load all regions except regions handled by local server instance
        if (this.authenticationService.isEuregio()) {
          if (region !== this.constantsService.codeTyrol && region !== this.constantsService.codeSouthTyrol && region !== this.constantsService.codeTrentino)
            url += "&regions=" + region;
        } else {
          url += "&regions=" + region;
        }
      }
    }
    const headers = this.authenticationService.newExternalServerAuthHeader(server);
    const options = { headers: headers };
    return this.http.get<Response>(url, options);
  }

  loadCaamlBulletins(date: Date): Observable<any> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&lang=" + this.settingsService.getLangString();
    const headers = this.authenticationService.newAuthHeader("application/xml");
    const options : any = { headers: headers, responseType: 'text' as 'text' };

    return this.http.get(url, options);
  }

  loadJsonBulletins(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };

    return this.http.get<Response>(url, options);
  }

  saveBulletins(bulletins, date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const jsonBulletins = [];
    for (let i = bulletins.length - 1; i >= 0; i--) {
      jsonBulletins.push(bulletins[i].toJson());
    }
    const body = JSON.stringify(jsonBulletins);
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  submitBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/submit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  publishBulletins(date: Date, region: string, change: boolean): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&change=" + change;
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  publishAllBulletins(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/all?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createCaaml(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/caaml?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createPdf(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/pdf?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createHtml(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/html?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createMap(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/map?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createStaticWidget(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/staticwidget?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  sendEmail(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  sendTestEmail(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTelegramChannel(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTestTelegramChannel(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerPushNotifications(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTestPushNotifications(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  checkBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/check?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  getLockedRegions(region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "regions/locked?region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  /*
    getLockedBulletins() : Observable<Response> {
    let url = this.constantsService.getServerUrl() + 'bulletins/locked';
    let headers = this.newAuthHeader();
    let options = { headers: headers };

    return this.http.get<Response>(url, options);
    }
  */

  isLocked(date: Date, region: string) {
    if (this.lockedRegions.has(region)) {
      for (const entry of this.lockedRegions.get(region)) {
        if (entry.getTime() === date.getTime()) {
          return true;
        }
      }
    }
    return false;
  }

  lockRegion(region: string, date: Date) {
    const regionLock = new RegionLockModel();
    regionLock.setUsername(this.authenticationService.getUsername());
    regionLock.setRegion(region);
    regionLock.setDate(date);
    regionLock.setLock(true);

    this.regionLocks.next(regionLock);

    console.debug("Region lock sent: " + regionLock.getDate().toLocaleDateString() + " - " + regionLock.getRegion());
  }

  unlockRegion(date: Date, region: string) {
    const regionLock = new RegionLockModel();
    regionLock.setUsername(this.authenticationService.getUsername());
    regionLock.setRegion(region);
    regionLock.setDate(date);
    regionLock.setLock(false);

    this.regionLocks.next(regionLock);

    console.debug("Region unlock sent: " + regionLock.getDate().toLocaleDateString() + " - " + regionLock.getRegion());
  }

  lockBulletin(date: Date, bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setUsername(this.authenticationService.getUsername());
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date);
    bulletinLock.setLock(true);

    this.bulletinLocks.next(bulletinLock);

    console.debug("Bulletin lock sent: " + bulletinLock.getDate() + " - " + bulletinLock.getBulletin());
  }

  unlockBulletin(date: Date, bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setUsername(this.authenticationService.getUsername());
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date);
    bulletinLock.setLock(false);

    this.bulletinLocks.next(bulletinLock);

    console.debug("Bulletin unlock sent: " + bulletinLock.getDate() + " - " + bulletinLock.getBulletin());
  }

  addLockedRegion(region: string, date: Date) {
    if (this.lockedRegions.has(region)) {
      if (this.lockedRegions.get(region).indexOf(date) === -1) {
        this.lockedRegions.get(region).push(date);
      } else {
        console.warn("[SocketIO] Region already locked!");
      }
    } else {
      const entry = new Array<Date>();
      entry.push(date);
      this.lockedRegions.set(region, entry);
    }
  }

  removeLockedRegion(region: string, date: Date) {
    let index = -1;
    if (this.lockedRegions.has(region)) {
      for (const entry of this.lockedRegions.get(region)) {
        if (entry.getTime() === date.getTime()) {
          index = this.lockedRegions.get(region).indexOf(entry);
        }
      }
    }

    if (index !== -1) {
      this.lockedRegions.get(region).splice(index, 1);
    } else {
      console.warn("[SocketIO] Region was not locked!");
    }
  }

  addLockedBulletin(bulletinId, username) {
    if (this.lockedBulletins.has(bulletinId)) {
      console.warn("Bulletin already locked by " + this.lockedBulletins.get(bulletinId));
    } else {
      this.lockedBulletins.set(bulletinId, username);
    }
  }

  removeLockedBulletin(bulletinId) {
    if (this.lockedBulletins.has(bulletinId)) {
      this.lockedBulletins.delete(bulletinId);
    } else {
      console.warn("Bulletin was not locked!");
    }
  }
}
