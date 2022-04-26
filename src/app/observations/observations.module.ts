import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { LeafletModule} from "@asymmetrik/ngx-leaflet";

import { NgxSidebarControlComponent } from "./ngx-sidebar-control.component";
import { ObservationsComponent } from "./observations.component";
import { ObservationEditorComponent } from "./observation-editor.component";
import { ObservationTableComponent } from "./observation-table.component";

import { BulletinsModule } from "../bulletins/bulletins.module";
// Bulletins Routing
import { ObservationsRoutingModule } from "./observations-routing.module";

import { TranslateModule } from "@ngx-translate/core";
import { CalendarModule } from "primeng/calendar";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { ToggleButtonModule } from "primeng/togglebutton";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { DropdownModule } from "primeng/dropdown";
import { MessagesModule } from "primeng/messages";
import { MessageModule } from "primeng/message";
import { AutoCompleteModule } from "primeng/autocomplete";

// Pipes
import { PipeModule } from "../pipes/pipes.module";

import { GeocodingService } from "./geocoding.service";
import { ObservationFilterService } from "./observation-filter.service";
import { ObservationsService } from "./observations.service";
import { NgxEchartsModule } from 'ngx-echarts';
import { BarChartComponent } from './charts/bar-chart/bar-chart.component';
import { RoseChartComponent } from './charts/rose-chart/rose-chart.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ObservationsLocalFilterComponent } from './observations-local-filter/observations-local-filter.component';

@NgModule({
  imports: [
    ObservationsRoutingModule,
    BulletinsModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    ToggleButtonModule,
    InputTextModule,
    InputTextareaModule,
    LeafletModule,
    DropdownModule,
    MessagesModule,
    MessageModule,
    AutoCompleteModule,
    PipeModule.forRoot(),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    NgMultiSelectDropDownModule.forRoot()
  ],
  declarations: [
    NgxSidebarControlComponent,
    ObservationsComponent,
    ObservationEditorComponent,
    ObservationTableComponent,
    BarChartComponent,
    RoseChartComponent,
    ObservationsLocalFilterComponent
  ],
  providers: [
    GeocodingService,
    ObservationFilterService,
    ObservationsService
  ]
})
export class ObservationsModule { }
