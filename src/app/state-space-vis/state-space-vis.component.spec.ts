import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateSpaceVisComponent } from './state-space-vis.component';

describe('StateSpaceVisComponent', () => {
  let component: StateSpaceVisComponent;
  let fixture: ComponentFixture<StateSpaceVisComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StateSpaceVisComponent]
    });
    fixture = TestBed.createComponent(StateSpaceVisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
