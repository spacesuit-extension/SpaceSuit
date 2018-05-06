import {assert} from 'chai'

import {stripPrefix} from '../middleware/sign-to-personal-sign'

describe('stripPrefix', function() {
  it('should strip prefixes when the prefix is there and lengths match', function () {
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a30'), '0x')
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a3401020304'), '0x01020304')
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a313001020304050607080910'), '0x01020304050607080910')
  })
  it('should leave data intact when the prefix is absent', function () {
    assert.equal(stripPrefix('0x010203040506070809'), '0x010203040506070809')
  })
  it("should leave data intact when the prefix is present, but the length isn't a number", function () {
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a29aa'), '0x19457468657265756d205369676e6564204d6573736167653a0a29aa')
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a3a01020304050607080910'), '0x19457468657265756d205369676e6564204d6573736167653a0a3a01020304050607080910')
  })
  it("should leave data intact when the prefix is present, but the lengths don't match", function () {
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a310102'), '0x19457468657265756d205369676e6564204d6573736167653a0a310102')
    assert.equal(stripPrefix('0x19457468657265756d205369676e6564204d6573736167653a0a313001'), '0x19457468657265756d205369676e6564204d6573736167653a0a313001')
  })
})
