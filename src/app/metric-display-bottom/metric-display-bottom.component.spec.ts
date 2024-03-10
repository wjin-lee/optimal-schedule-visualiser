import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricDisplayBottomComponent } from './metric-display-bottom.component';

describe('MetricDisplayBottomComponent', () => {
  let component: MetricDisplayBottomComponent;
  let fixture: ComponentFixture<MetricDisplayBottomComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MetricDisplayBottomComponent]
    });
    fixture = TestBed.createComponent(MetricDisplayBottomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
