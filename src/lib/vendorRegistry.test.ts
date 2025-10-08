import { describe, it, expect, beforeEach } from 'vitest';
import { vendorRegistry } from './vendorRegistry';
import type { VendorConfig } from '../types/vendor';

const testVendor: VendorConfig = {
  vendorId: 'test',
  name: 'Test Vendor',
  currency: 'USD',
  kpiThresholds: {
    latency_ms: 100,
    jitter_ms: 5,
    frameLoss_pct: 0.5,
  },
  penaltyRules: {},
};

describe('vendorRegistry', () => {
  beforeEach(() => {
    vendorRegistry.clear();
  });

  it('should register a vendor', () => {
    vendorRegistry.register(testVendor);
    expect(vendorRegistry.exists('test')).toBe(true);
  });

  it('should retrieve a registered vendor', () => {
    vendorRegistry.register(testVendor);
    const retrieved = vendorRegistry.get('test');
    expect(retrieved).toEqual(testVendor);
  });

  it('should return undefined for non-existent vendor', () => {
    const retrieved = vendorRegistry.get('nonexistent');
    expect(retrieved).toBeUndefined();
  });

  it('should register multiple vendors', () => {
    const vendors = [testVendor, { ...testVendor, vendorId: 'test2', name: 'Test 2' }];
    vendorRegistry.registerMultiple(vendors);
    expect(vendorRegistry.getAll()).toHaveLength(2);
  });

  it('should sort vendors by displayOrder', () => {
    vendorRegistry.register({ ...testVendor, displayOrder: 2 });
    vendorRegistry.register({ ...testVendor, vendorId: 'test2', displayOrder: 1 });

    const all = vendorRegistry.getAll();
    expect(all[0].vendorId).toBe('test2');
    expect(all[1].vendorId).toBe('test');
  });

  it('should filter out inactive vendors', () => {
    vendorRegistry.register({ ...testVendor, isActive: true });
    vendorRegistry.register({ ...testVendor, vendorId: 'inactive', isActive: false });

    const active = vendorRegistry.getAll();
    expect(active).toHaveLength(1);
    expect(active[0].vendorId).toBe('test');
  });

  it('should remove a vendor', () => {
    vendorRegistry.register(testVendor);
    expect(vendorRegistry.exists('test')).toBe(true);

    vendorRegistry.remove('test');
    expect(vendorRegistry.exists('test')).toBe(false);
  });

  it('should clear all vendors', () => {
    vendorRegistry.registerMultiple([
      testVendor,
      { ...testVendor, vendorId: 'test2' },
    ]);
    expect(vendorRegistry.getAll()).toHaveLength(2);

    vendorRegistry.clear();
    expect(vendorRegistry.getAll()).toHaveLength(0);
  });
});
