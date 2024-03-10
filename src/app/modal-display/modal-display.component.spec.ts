import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDisplayComponent } from './modal-display.component';

describe('ModalDisplayComponent', () => {
  let component: ModalDisplayComponent;
  let fixture: ComponentFixture<ModalDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalDisplayComponent]
    });
    fixture = TestBed.createComponent(ModalDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
