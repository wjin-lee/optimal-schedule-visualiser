import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricDisplayTopComponent } from './metric-display-top.component';

describe('MetricDisplayTopComponent', () => {
  let component: MetricDisplayTopComponent;
  let fixture: ComponentFixture<MetricDisplayTopComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MetricDisplayTopComponent]
    });
    fixture = TestBed.createComponent(MetricDisplayTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
