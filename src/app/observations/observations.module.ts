import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { ObservationsComponent } from "./observations.component";
import { QuickReportComponent } from "./quick-report.component";

// Bulletins Routing
import { ObservationsRoutingModule } from "./observations-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { ConfirmDialogModule } from "primeng/confirmdialog";

// Pipes
import { PipeModule } from "../pipes/pipes.module";


@NgModule({
  imports: [
    ObservationsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    ConfirmDialogModule,
    PipeModule.forRoot()
  ],
  declarations: [
    ObservationsComponent,
    QuickReportComponent
  ]
})
export class ObservationsModule { }
