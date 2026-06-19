"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateOrderDto", {
    enumerable: true,
    get: function() {
        return CreateOrderDto;
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
let CreateOrderDto = class CreateOrderDto {
    total_amount;
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 149.99
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0)
], CreateOrderDto.prototype, "total_amount", void 0);

//# sourceMappingURL=create-order.dto.js.map