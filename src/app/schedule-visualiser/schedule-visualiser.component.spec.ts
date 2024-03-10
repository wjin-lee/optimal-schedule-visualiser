import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleVisualiserComponent } from './schedule-visualiser.component';

describe('ScheduleVisualiserComponent', () => {
  let component: ScheduleVisualiserComponent;
  let fixture: ComponentFixture<ScheduleVisualiserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleVisualiserComponent]
    });
    fixture = TestBed.createComponent(ScheduleVisualiserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
