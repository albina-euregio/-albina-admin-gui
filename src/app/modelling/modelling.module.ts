import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ModellingRoutingModule } from "./modelling-routing.module";
import { IndexComponent } from "./index.component";
import { SnowpackComponent } from "./snowpack.component";
import { SnowpackMeteoComponent } from "./snowpack.meteo.component";
import { ModellingService } from "./modelling.service";
import { TranslateModule } from "@ngx-translate/core";
import { FormsModule } from "@angular/forms";
import { ForecastComponent } from "./forecast.component";
import { DialogModule } from "primeng/dialog";
import { MultiSelectModule } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { RegionsService } from "../providers/regions-service/regions.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ModellingRoutingModule,
    TranslateModule,
    DialogModule,
    MultiSelectModule,
    ButtonModule,
    IndexComponent,
    SnowpackComponent,
    SnowpackMeteoComponent,
    ForecastComponent
  ],
  providers: [ModellingService, RegionsService]
})
export class ModellingModule {}
