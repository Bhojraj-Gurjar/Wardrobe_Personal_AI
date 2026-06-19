"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddToWishlistDto", {
    enumerable: true,
    get: function() {
        return AddToWishlistDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AddToWishlistDto = class AddToWishlistDto {
    product_id;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'product-uuid'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)()
], AddToWishlistDto.prototype, "product_id", void 0);

//# sourceMappingURL=add-to-wishlist.dto.js.map