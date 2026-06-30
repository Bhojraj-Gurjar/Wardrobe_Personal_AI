"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SearchProductsDto", {
    enumerable: true,
    get: function() {
        return SearchProductsDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _queryproductsdto = require("./query-products.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let SearchProductsDto = class SearchProductsDto extends _queryproductsdto.QueryProductsDto {
    q;
    search;
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'nike jacket',
        description: 'Search term matched against name, sku, brand, category, and description'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], SearchProductsDto.prototype, "q", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Alias for q'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)()
], SearchProductsDto.prototype, "search", void 0);

//# sourceMappingURL=search-products.dto.js.map