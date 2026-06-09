import { GoneException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

describe('GalleryController', () => {
  let controller: GalleryController;
  const galleryService = {
    getGallery: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [{ provide: GalleryService, useValue: galleryService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GalleryController);
    jest.clearAllMocks();
  });

  it('rejects missing token', () => {
    expect(() => controller.getGallery('evt-1', undefined)).toThrow(UnauthorizedException);
  });

  it('rejects invalid token format', () => {
    expect(() => controller.getGallery('evt-1', '../../../etc/passwd')).toThrow(
      UnauthorizedException,
    );
  });

  it('returns gallery for valid token', async () => {
    galleryService.getGallery.mockResolvedValue({
      event: { name: 'Test', theme: 'luxury_gold', primaryColor: '#D4A843' },
      captures: [],
      nextCursor: null,
    });
    const result = await controller.getGallery('evt-1', 'a1b2c3d4e5f6');
    expect(result.captures).toEqual([]);
    expect(galleryService.getGallery).toHaveBeenCalledWith(
      'evt-1',
      'a1b2c3d4e5f6',
      expect.objectContaining({ limit: 50 }),
    );
  });

  it('propagates service not found', async () => {
    galleryService.getGallery.mockRejectedValue(new NotFoundException());
    await expect(controller.getGallery('evt-1', 'a1b2c3d4e5f6')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('propagates expired gallery', async () => {
    galleryService.getGallery.mockRejectedValue(new GoneException());
    await expect(controller.getGallery('evt-1', 'a1b2c3d4e5f6')).rejects.toBeInstanceOf(
      GoneException,
    );
  });
});
