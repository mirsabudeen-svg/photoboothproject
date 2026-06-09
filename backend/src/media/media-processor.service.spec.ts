import { MediaProcessorService } from './media-processor.service';

describe('MediaProcessorService', () => {
  it('enqueueProcessing schedules async work without throwing', () => {
    const captures = { findOne: jest.fn(), save: jest.fn() };
    const storage = { getObject: jest.fn(), putObject: jest.fn(), variantKey: jest.fn() };
    const service = new MediaProcessorService(captures as never, storage as never);

    expect(() => service.enqueueProcessing('capture-1')).not.toThrow();
  });
});
