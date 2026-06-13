import { FileUtils, ArrayUtils, ColorUtils, ValidationUtils } from './index';

describe('FileUtils.formatFileSize', () => {
  it('formats bytes into human-readable units', () => {
    expect(FileUtils.formatFileSize(0)).toBe('0 Bytes');
    expect(FileUtils.formatFileSize(1024)).toBe('1 KB');
    expect(FileUtils.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(FileUtils.formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('ArrayUtils', () => {
  it('moveItem reorders without mutating the original', () => {
    const arr = ['a', 'b', 'c'];
    expect(ArrayUtils.moveItem(arr, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(arr).toEqual(['a', 'b', 'c']); // original untouched
  });

  it('removeItem removes by index', () => {
    expect(ArrayUtils.removeItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('toggleItem adds when absent and removes when present', () => {
    expect(ArrayUtils.toggleItem(['a'], 'b')).toEqual(['a', 'b']);
    expect(ArrayUtils.toggleItem(['a', 'b'], 'b')).toEqual(['a']);
  });
});

describe('ColorUtils', () => {
  it('round-trips hex <-> rgb', () => {
    expect(ColorUtils.hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
    expect(ColorUtils.rgbToHex(255, 136, 0)).toBe('#ff8800');
    expect(ColorUtils.hexToRgb('not-a-color')).toBeNull();
  });
});

describe('ValidationUtils', () => {
  it('validates emails and urls', () => {
    expect(ValidationUtils.isValidEmail('a@b.com')).toBe(true);
    expect(ValidationUtils.isValidEmail('nope')).toBe(false);
    expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
    expect(ValidationUtils.isValidUrl('nope')).toBe(false);
  });
});
