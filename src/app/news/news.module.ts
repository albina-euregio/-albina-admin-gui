import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NewsComponent } from './news.component';
import { CreateNewsComponent } from './create-news.component';

// Bulletins Routing
import { NewsRoutingModule } from './news-routing.module';
import { TranslateModule } from 'ng2-translate';
import { ConfirmDialogModule, SharedModule } from 'primeng/primeng';


@NgModule({
  imports: [
    NewsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    ConfirmDialogModule,
    SharedModule
  ],
  declarations: [
    NewsComponent,
    CreateNewsComponent
  ]
})
export class NewsModule { }
