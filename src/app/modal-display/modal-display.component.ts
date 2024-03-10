import { Component } from '@angular/core';
import { ModalService } from '../services/modal/modal.service';
import { ModalTemplate } from '../enums/modal-template.enum';
import { StateSpaceSearchService } from '../services/state-space-search/state-space-search.service';

@Component({
  selector: 'app-modal-display',
  templateUrl: './modal-display.component.html',
  styleUrls: ['./modal-display.component.css'],
})
export class ModalDisplayComponent {
  modalTemplateTypes = ModalTemplate
  modalTemplate: ModalTemplate = ModalTemplate.HIDDEN;  // Don't show until explicitly told to by the ModalService.

  constructor(public modalService: ModalService, public stateSpaceSearchService: StateSpaceSearchService) {
    modalService.modalTemplate$.subscribe(template => this.modalTemplate = template)
  }

  onStartBtnClicked() {
    this.stateSpaceSearchService.startSearch();
  }
}
