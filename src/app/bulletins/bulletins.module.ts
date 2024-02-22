import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { AspectsComponent } from "./aspects.component";
import { DangerRatingComponent } from "./danger-rating.component";
import { DangerRatingIconComponent } from "./danger-rating-icon.component";
import { AvalancheProblemComponent } from "./avalanche-problem.component";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { MatrixComponent } from "./matrix.component";
import { MatrixParameterComponent } from "./matrix-parameter.component";
import { CaamlComponent } from "./caaml.component";
import { JsonComponent } from "./json.component";
import { TabsComponent } from "./tabs.component";
import { TabComponent } from "./tab.component";

// Bulletins Routing
import { BulletinsRoutingModule } from "./bulletins-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { NgxSliderModule } from '../ngx-slider/lib/slider.module';

// Pipes
import { PipeModule } from "../pipes/pipes.module";
import { DatePipe } from "@angular/common";

import { AccordionModule } from "ngx-bootstrap/accordion";
import { DialogModule } from "primeng/dialog";
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { MapService } from "../providers/map-service/map.service";


@NgModule({
    imports: [
        BulletinsRoutingModule,
        FormsModule,
        CommonModule,
        TranslateModule,
        ConfirmDialogModule,
        PipeModule.forRoot(),
        AccordionModule.forRoot(),
        NgxSliderModule,
        DialogModule
    ],
    exports: [
        AspectsComponent
    ],
    declarations: [
        BulletinsComponent,
        CreateBulletinComponent,
        AspectsComponent,
        DangerRatingComponent,
        DangerRatingIconComponent,
        AvalancheProblemComponent,
        AvalancheProblemDetailComponent,
        AvalancheProblemDecisionTreeComponent,
        AvalancheProblemPreviewComponent,
        MatrixComponent,
        MatrixParameterComponent,
        CaamlComponent,
        JsonComponent,
        TabsComponent,
        TabComponent
    ],
})
export class BulletinsModule { }
