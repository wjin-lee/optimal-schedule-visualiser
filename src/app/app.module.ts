import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { StateSpaceVisComponent } from './state-space-vis/state-space-vis.component';
import { MetricDisplayTopComponent } from './metric-display-top/metric-display-top.component';
import { ModalDisplayComponent } from './modal-display/modal-display.component';
import { ScheduleVisualiserComponent } from './schedule-visualiser/schedule-visualiser.component';
import { MetricDisplayBottomComponent } from './metric-display-bottom/metric-display-bottom.component';

@NgModule({
  declarations: [
    AppComponent,
    StateSpaceVisComponent,
    MetricDisplayTopComponent,
    ModalDisplayComponent,
    ScheduleVisualiserComponent,
    MetricDisplayBottomComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      {path: '**', component: AppComponent},  // Single page app
    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
