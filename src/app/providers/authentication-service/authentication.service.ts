import { Injectable, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AuthorModel } from "../../models/author.model";
import { ServerModel } from "../../models/server.model";
import { RegionConfiguration, ServerConfiguration } from "../configuration-service/configuration.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";

@Injectable()
export class AuthenticationService {
  private currentAuthor: AuthorModel;
  private internalRegions: RegionConfiguration[];
  private externalServers: ServerModel[];
  private jwtHelper: JwtHelperService;
  private activeRegion: RegionConfiguration | undefined;

  constructor(
    private localStorageService: LocalStorageService,
    private http: HttpClient,
    private constantsService: ConstantsService,
    private sanitizer: DomSanitizer,
  ) {
    this.externalServers = [];
    try {
      this.setCurrentAuthor(this.localStorageService.getCurrentAuthor());
    } catch (e) {
      this.localStorageService.setCurrentAuthor(undefined);
    }
    try {
      this.setActiveRegion(this.localStorageService.getActiveRegion());
    } catch (e) {
      this.localStorageService.setActiveRegion(undefined);
    }
    try {
      this.setInternalRegions(this.localStorageService.getInternalRegions());
    } catch (e) {
      this.localStorageService.setInternalRegions(undefined);
    }
    try {
      this.setExternalServers(this.localStorageService.getExternalServers());
    } catch (e) {
      this.localStorageService.setExternalServers(undefined);
    }
    this.jwtHelper = new JwtHelperService();
  }

  public login(username: string, password: string): Observable<boolean> {
    const url = this.constantsService.getServerUrl() + "authentication";
    const body = JSON.stringify({ username, password });
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const options = { headers: headers };

    return this.http.post<AuthenticationResponse>(url, body, options).pipe(
      map((data) => {
        if (data.access_token) {
          this.setCurrentAuthor(data);
          let authorRegions = this.getCurrentAuthorRegions();
          let activeRegionFromLocalStorage = this.localStorageService.getActiveRegion();
          this.setActiveRegion(
            authorRegions.find((r) => r.id === activeRegionFromLocalStorage?.id) ?? authorRegions?.[0],
          );
          this.loadInternalRegions();
          this.externalServerLogins();
          return true;
        } else {
          return false;
        }
      }),
    );
  }

  public isUserLoggedIn(): boolean {
    return this.currentAuthor?.accessToken && !this.jwtHelper.isTokenExpired(this.currentAuthor.accessToken);
  }

  public logout() {
    console.debug("[" + this.currentAuthor?.name + "] Logged out!");
    this.currentAuthor = null;
    this.activeRegion = undefined;
    this.localStorageService.setCurrentAuthor(undefined);
    this.localStorageService.setInternalRegions(undefined);
    this.localStorageService.setExternalServers(undefined);
    this.externalServers = [];
  }

  private loadInternalRegions(): void {
    const url = this.constantsService.getServerUrl() + "regions";
    const options = { headers: this.newAuthHeader() };

    this.http.get<RegionConfiguration[]>(url, options).subscribe((regions) => this.setInternalRegions(regions));
  }

  private setInternalRegions(regions: RegionConfiguration[]) {
    this.internalRegions = regions;
    this.localStorageService.setInternalRegions(this.internalRegions);
  }

  private externalServerLogins() {
    const url = this.constantsService.getServerUrl() + "server/external";
    const options = { headers: this.newAuthHeader() };

    this.http.get<ServerConfiguration[]>(url, options).subscribe(
      (data) => {
        for (const entry of data) {
          this.externalServerLogin(entry.apiUrl, entry.userName, entry.password, entry.name).subscribe(
            (data) => {
              if (data === true) {
                console.debug("[" + entry.name + "] Logged in!");
              } else {
                console.error("[" + entry.name + "] Login failed!");
              }
            },
            (error) => {
              console.error("[" + entry.name + "] Login failed: " + JSON.stringify(error._body));
            },
          );
        }
      },
      (error) => {
        console.error("External server instances could not be loaded: " + JSON.stringify(error._body));
      },
    );
  }

  public externalServerLogin(apiUrl: string, username: string, password: string, name: string): Observable<boolean> {
    const url = apiUrl + "authentication";
    const body = JSON.stringify({ username, password });
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const options = { headers: headers };

    return this.http.post<AuthenticationResponse>(url, body, options).pipe(
      map((data) => {
        if (data.access_token) {
          this.addExternalServer(data, apiUrl, name, username, password);
          return true;
        } else {
          return false;
        }
      }),
    );
  }

  private addExternalServer(
    json: Partial<AuthenticationResponse>,
    apiUrl: string,
    serverName: string,
    username: string,
    password: string,
  ) {
    if (!json) {
      return;
    }
    var server = ServerModel.createFromJson(json);
    server.setApiUrl(apiUrl);
    server.setName(serverName);
    this.externalServers.push(server);
    this.localStorageService.setExternalServers(this.externalServers);
  }

  private setExternalServers(json: Partial<ServerModel>[]) {
    if (!json) {
      return;
    }
    for (const server of json) this.externalServers.push(ServerModel.createFromJson(server));
  }

  public checkExternalServerLogin() {
    for (let server of this.externalServers) {
      if (this.jwtHelper.isTokenExpired(server.accessToken)) {
        this.externalServers = [];
        this.localStorageService.setExternalServers(undefined);
        this.externalServerLogins();
        break;
      }
    }
  }

  public getAuthor() {
    return this.currentAuthor;
  }

  public getUsername(): string {
    return this.currentAuthor?.name;
  }

  public getEmail(): string {
    return this.currentAuthor?.email;
  }

  public newAuthHeader(mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + this.currentAuthor?.accessToken;
    return new HttpHeaders({
      "Content-Type": mime,
      Accept: mime,
      Authorization: authHeader,
    });
  }

  public newFileAuthHeader(mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + this.currentAuthor?.accessToken;
    return new HttpHeaders({
      Accept: mime,
      Authorization: authHeader,
    });
  }

  public newExternalServerAuthHeader(externalAuthor: ServerModel, mime = "application/json"): HttpHeaders {
    const authHeader = "Bearer " + externalAuthor.accessToken;
    return new HttpHeaders({
      "Content-Type": mime,
      Accept: mime,
      Authorization: authHeader,
    });
  }

  public getUserImage() {
    return this.currentAuthor?.image;
  }

  public getUserImageSanitized() {
    if (this.currentAuthor && this.currentAuthor.image) {
      return this.sanitizer.sanitize(SecurityContext.URL, "data:image/jpg;base64," + this.currentAuthor.image);
    } else {
      return null;
    }
  }

  public getActiveRegion(): RegionConfiguration | undefined {
    return this.activeRegion;
  }

  public getActiveRegionId(): string | undefined {
    return this.activeRegion?.id;
  }

  public setActiveRegion(region: RegionConfiguration) {
    if (!this.currentAuthor) {
      return;
    }
    if (
      this.currentAuthor
        .getRegions()
        .map((region) => region.id)
        .includes(region.id)
    ) {
      this.activeRegion = region;
      this.localStorageService.setActiveRegion(this.activeRegion);
    } else {
      this.logout();
    }
  }

  public getUserLat() {
    return this.activeRegion?.mapCenterLat ?? 47.1;
  }

  public getUserLng() {
    return this.activeRegion?.mapCenterLng ?? 11.44;
  }

  public isCurrentUserInRole(role: string): boolean {
    return this.currentAuthor?.getRoles?.()?.includes(role);
  }

  public getCurrentAuthor() {
    return this.currentAuthor;
  }

  private setCurrentAuthor(json: Partial<AuthorModel>) {
    if (!json) {
      return;
    }
    this.currentAuthor = AuthorModel.createFromJson(json);
    this.localStorageService.setCurrentAuthor(this.currentAuthor);
  }

  public getCurrentAuthorRegions(): RegionConfiguration[] {
    return this.currentAuthor?.getRegions() || [];
  }

  public getInternalRegions(): string[] {
    return this.internalRegions.map((r) => r.id);
  }

  public getExternalServers(): ServerModel[] {
    return this.externalServers;
  }

  public isInternalRegion(region: string): boolean {
    return this.getInternalRegions().some((r) => region?.startsWith(r));
  }

  public isExternalRegion(region: string): boolean {
    if (this.isInternalRegion(region)) {
      return false;
    }
    for (const externalServer of this.externalServers) {
      if (externalServer.getRegions().includes(region)) return true;
    }
    return false;
  }
}

export interface AuthenticationResponse {
  email: string;
  name: string;
  roles: string[];
  regions: RegionConfiguration[];
  access_token: string;
  refresh_token: string;
  api_url: string;
}
