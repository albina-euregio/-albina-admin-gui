import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from 'ng2-translate/src/translate.service';
import { SettingsService } from '../providers/settings-service/settings.service';
import { AvalancheSituationModel } from '../models/avalanche-situation.model';
import * as Enums from '../enums/enums';

@Component({
  selector: 'avalanche-situation',
  templateUrl: 'avalanche-situation.component.html'
})
export class AvalancheSituationComponent {

  @Input() avalancheSituationModel: AvalancheSituationModel;
  @Input() disabled: boolean;
  @Input() label: string;

  showAspects: boolean;
  avalancheSituationEnum = Enums.AvalancheSituation;

  constructor(
    private translate: TranslateService,
    public settingsService: SettingsService)
  {
  }

  ngAfterContentInit() {
    if (this.avalancheSituationModel.getAvalancheSituation() != undefined && !this.isAvalancheSituation("favourable_situation"))
      this.showAspects = true;
    else
      this.showAspects = false;
  }

  isAvalancheSituation(situation) {
    if (this.avalancheSituationModel && this.avalancheSituationModel.avalancheSituation == situation)
      return true;
    return false;
  }

  selectAvalancheSituation(situation) {
    if (this.isAvalancheSituation(Enums.AvalancheSituation[situation])) {
      this.avalancheSituationModel.setAvalancheSituation(undefined);
      this.avalancheSituationModel.setAspects(new Array<Enums.Aspect>());
      this.showAspects = false;
    } else {
      this.avalancheSituationModel.setAvalancheSituation(Enums.AvalancheSituation[situation]);
      if (this.isAvalancheSituation("favourable_situation")) {
        this.avalancheSituationModel.setAspects(new Array<Enums.Aspect>());
        this.showAspects = false;
      } else
        this.showAspects = true;
    }
  }

  updateElevationHigh() {
    if (this.avalancheSituationModel) {
      this.avalancheSituationModel.elevationHigh = Math.round(this.avalancheSituationModel.elevationHigh/100)*100;
      if (this.avalancheSituationModel.elevationHigh > 9000)
        this.avalancheSituationModel.elevationHigh = 9000;
      else if (this.avalancheSituationModel.elevationHigh < 0)
        this.avalancheSituationModel.elevationHigh = 0;
    }
  }

  updateElevationLow() {
    if (this.avalancheSituationModel) {
      this.avalancheSituationModel.elevationLow = Math.round(this.avalancheSituationModel.elevationLow/100)*100;
      if (this.avalancheSituationModel.elevationLow > 9000)
        this.avalancheSituationModel.elevationLow = 9000;
      else if (this.avalancheSituationModel.elevationLow < 0)
        this.avalancheSituationModel.elevationLow = 0;
    }
  }
}
