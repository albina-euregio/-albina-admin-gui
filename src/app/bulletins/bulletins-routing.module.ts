import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { CaamlComponent } from "./caaml.component";
import { JsonComponent } from "./json.component";

import { AuthGuard } from "../guards/auth.guard";

const routes: Routes = [
  {
    path: "",
    component: BulletinsComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Bulletins",
    },
  },
  {
    path: ":date",
    component: CreateBulletinComponent,
    canActivate: [AuthGuard],
    data: {
      title: "New Bulletin",
    },
  },
  {
    path: "caaml",
    component: CaamlComponent,
    canActivate: [AuthGuard],
    data: {
      title: "CAAML",
    },
  },
  {
    path: "json",
    component: JsonComponent,
    canActivate: [AuthGuard],
    data: {
      title: "JSON",
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BulletinsRoutingModule {}
