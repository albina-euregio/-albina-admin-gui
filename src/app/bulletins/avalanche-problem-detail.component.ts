import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { MapService } from "../providers/map-service/map.service";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";
import { TranslateService } from "@ngx-translate/core";
import { DialogService } from "primeng/dynamicdialog";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";

@Component({
  selector: "app-avalanche-problem-detail",
  templateUrl: "avalanche-problem-detail.component.html",
  styleUrls: ["avalanche-problem-detail.component.scss"],
  providers: [DialogService]
})
export class AvalancheProblemDetailComponent implements OnChanges {

  @Input() bulletin: BulletinModel;
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() avalancheProblemModel: AvalancheProblemModel;
  @Input() disabled: boolean;
  @Input() count: number;
  @Input() afternoon: boolean;
  @Output() changeAvalancheProblemDetailEvent = new EventEmitter<string>();

  avalancheProblemEnum = Enums.AvalancheProblem;
  snowpackStability = Enums.SnowpackStability;
  frequency = Enums.Frequency;
  avalancheSize = Enums.AvalancheSize;
  useElevationHigh = false;
  useElevationLow = false;

  public terrainFeatureTextcat: string;
  public terrainFeatureDe: string;
  public terrainFeatureIt: string;
  public terrainFeatureEn: string;
  public terrainFeatureFr: string;

  directionEnum = Enums.Direction;

  constructor(
    public settingsService: SettingsService,
    public authenticationService: AuthenticationService,
    public mapService: MapService,
    public dialogService: DialogService,
    public translateService: TranslateService) {
  }

  ngOnChanges() {
    if (this.avalancheProblemModel.getTreelineHigh() || this.avalancheProblemModel.getElevationHigh() !== undefined) {
      this.useElevationHigh = true;
    } else {
      this.useElevationHigh = false;
    }
    if (this.avalancheProblemModel.getTreelineLow() || this.avalancheProblemModel.getElevationLow() !== undefined) {
      this.useElevationLow = true;
    } else {
      this.useElevationLow = false;
    }
  }

  public forLabelId(key: string): string {
    return this.count + (this.afternoon ? '_pm_' : '_am_') + key;
  }

  isAvalancheProblem(avalancheProblem) {
    if (this.avalancheProblemModel && this.avalancheProblemModel.avalancheProblem === avalancheProblem) {
      return true;
    }
    return false;
  }

  selectAvalancheProblem(avalancheProblem) {
    if (this.isAvalancheProblem(Enums.AvalancheProblem[avalancheProblem])) {
      this.avalancheProblemModel.setAvalancheProblem(undefined);
    } else {
      this.avalancheProblemModel.setAvalancheProblem(Enums.AvalancheProblem[avalancheProblem]);
    }
    this.changeAvalancheProblemDetailEvent.emit();
  }

  updateElevationHigh() {
    if (this.avalancheProblemModel) {
      this.avalancheProblemModel.elevationHigh = Math.round(this.avalancheProblemModel.elevationHigh / 100) * 100;
      if (this.avalancheProblemModel.elevationHigh > 9000) {
        this.avalancheProblemModel.elevationHigh = 9000;
      } else if (this.avalancheProblemModel.elevationHigh < 0) {
        this.avalancheProblemModel.elevationHigh = 0;
      }
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.mapService.updateAggregatedRegion(this.bulletin);
    this.mapService.selectAggregatedRegion(this.bulletin);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  updateElevationLow() {
    if (this.avalancheProblemModel) {
      this.avalancheProblemModel.elevationLow = Math.round(this.avalancheProblemModel.elevationLow / 100) * 100;
      if (this.avalancheProblemModel.elevationLow > 9000) {
        this.avalancheProblemModel.elevationLow = 9000;
      } else if (this.avalancheProblemModel.elevationLow < 0) {
        this.avalancheProblemModel.elevationLow = 0;
      }
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.mapService.updateAggregatedRegion(this.bulletin);
    this.mapService.selectAggregatedRegion(this.bulletin);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.avalancheProblemModel.treelineHigh) {
      this.avalancheProblemModel.treelineHigh = false;
    } else {
      this.avalancheProblemModel.treelineHigh = true;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.mapService.updateAggregatedRegion(this.bulletin);
    this.mapService.selectAggregatedRegion(this.bulletin);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.avalancheProblemModel.treelineLow) {
      this.avalancheProblemModel.treelineLow = false;
    } else {
      this.avalancheProblemModel.treelineLow = true;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.mapService.updateAggregatedRegion(this.bulletin);
    this.mapService.selectAggregatedRegion(this.bulletin);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.avalancheProblemModel.treelineHigh = false;
      this.avalancheProblemModel.elevationHigh = undefined;
      this.changeAvalancheProblemDetailEvent.emit();
      this.bulletinDaytimeDescription.updateDangerRating();
      this.mapService.updateAggregatedRegion(this.bulletin);
      this.mapService.selectAggregatedRegion(this.bulletin);
    } else {
      this.useElevationHigh = true;
    }
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.avalancheProblemModel.treelineLow = false;
      this.avalancheProblemModel.elevationLow = undefined;
      this.bulletinDaytimeDescription.updateDangerRating();
      this.mapService.updateAggregatedRegion(this.bulletin);
      this.mapService.selectAggregatedRegion(this.bulletin);
      this.changeAvalancheProblemDetailEvent.emit();
    } else {
      this.useElevationLow = true;
    }
  }

  deleteTextcat(event) {
    this.terrainFeatureTextcat = undefined;
    this.terrainFeatureDe = undefined;
    this.terrainFeatureIt = undefined;
    this.terrainFeatureEn = undefined;
    this.terrainFeatureFr = undefined;
    this.changeAvalancheProblemDetailEvent.emit();
  }

  isDangerRatingDirection(dir) {
    if (this.avalancheProblemModel && this.avalancheProblemModel.getDangerRatingDirection() === dir) {
      return true;
    }
    return false;
  }

  setDangerRatingDirection(event, dir: string) {
    event.stopPropagation();
    this.avalancheProblemModel.setDangerRatingDirection(Enums.Direction[dir]);
    this.bulletinDaytimeDescription.updateDangerRating();
    this.mapService.updateAggregatedRegion(this.bulletin);
    this.mapService.selectAggregatedRegion(this.bulletin);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  showDecisionTreeDialog() {
    const ref = this.dialogService.open(AvalancheProblemDecisionTreeComponent, {
      header: this.translateService.instant("bulletins.create.decisionTree.decisionTree"),
      contentStyle: {"width": "95vw", "height": "85vh", "overflow": "hidden"}
    });
    ref.onClose.subscribe((data) => {
      if (data && "problem" in data) {
        this.avalancheProblemModel.setAvalancheProblem(undefined);
        this.selectAvalancheProblem(data["problem"]);
      }
    });
  }

  changeMatrix(event) {
    this.changeAvalancheProblemDetailEvent.emit();
  }

  changeAspects(event) {
    this.changeAvalancheProblemDetailEvent.emit();
  }
}
