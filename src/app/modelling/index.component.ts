import { Component } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: "./index.component.html"
})
export class IndexComponent {}
