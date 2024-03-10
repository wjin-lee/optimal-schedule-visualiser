import { TestBed } from '@angular/core/testing';

import { StateSpaceSearchService } from './state-space-search.service';

describe('SearchProgressService', () => {
  let service: StateSpaceSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateSpaceSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
