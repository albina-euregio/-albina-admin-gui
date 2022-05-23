import { Component, Input } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ConfigurationService, ServerConfiguration } from "../providers/configuration-service/configuration.service";
import { SocialmediaService } from "../providers/socialmedia-service/socialmedia.service";
import * as Enums from "../enums/enums";
import { AlertComponent } from "ngx-bootstrap/alert";

@Component({
  templateUrl: "server-configuration.component.html",
  selector: "app-server-configuration"
})
export class ServerConfigurationComponent {

  @Input() config: ServerConfiguration;
  @Input() externalServer: boolean;

  public statusMap: Map<number, Enums.BulletinStatus>;
  public saveConfigurationLoading: boolean;

  public alerts: any[] = [];

  constructor(
    private translateService: TranslateService,
    public configurationService: ConfigurationService,
    public socialmediaService: SocialmediaService) {
    this.statusMap = new Map<number, Enums.BulletinStatus>();
    this.saveConfigurationLoading = false;
  }

  public save() {
    this.saveConfigurationLoading = true;
    const json = Object();
    json["id"] = this.config.id;
    json["name"] = this.config.name;
    json["userName"] = this.config.userName;
    json["password"] = this.config.password;
    json["apiUrl"] = this.config.apiUrl;
    json["externalServer"] = this.config.externalServer;
    json["publishAt5PM"] = this.config.publishAt5PM;
    json["publishAt8AM"] = this.config.publishAt8AM;
    json["pdfDirectory"] = this.config.pdfDirectory;
    json["htmlDirectory"] = this.config.htmlDirectory;
    json["serverImagesUrl"] = this.config.serverImagesUrl;
    json["mapsPath"] = this.config.mapsPath;
    json["mediaPath"] = this.config.mediaPath;
    json["mapProductionUrl"] = this.config.mapProductionUrl;

    if (!this.config.isNew) {
      this.configurationService.updateServerConfiguration(json).subscribe(
        data => {
          this.saveConfigurationLoading = false;
          console.debug("Server configuration saved!");
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("admin.server-configuration.success"),
            timeout: 5000
          });
        },
        error => {
          this.saveConfigurationLoading = false;
          console.error("Server configuration could not be saved!");
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("admin.server-configuration.error"),
            timeout: 5000
          });
        }
      );
    } else {
      this.configurationService.createServerConfiguration(json).subscribe(
        data => {
          this.saveConfigurationLoading = false;
          console.debug("Server configuration saved!");
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("admin.server-configuration.success"),
            timeout: 5000
          });
        },
        error => {
          this.saveConfigurationLoading = false;
          console.error("Server configuration could not be saved!");
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("admin.server-configuration.error"),
            timeout: 5000
          });
        }
      );
    }
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter(alert => alert !== dismissedAlert);
  }
}
