"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductCategoryService", {
    enumerable: true,
    get: function() {
        return ProductCategoryService;
    }
});
const _common = require("@nestjs/common");
const _apicacheservice = require("../../../common/services/api-cache.service");
const _productcategoryrepository = require("../repositories/product-category.repository");
const _productcategoryseed = require("../constants/product-category.seed");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ProductCategoryService = class ProductCategoryService {
    constructor(productCategoryRepository, apiCacheService){
        this.productCategoryRepository = productCategoryRepository;
        this.apiCacheService = apiCacheService;
        this.logger = new _common.Logger(ProductCategoryService.name);
    }
    async findAll({ includeInactive = false } = {}) {
        const cacheKey = this.apiCacheService.buildKey('products:categories', includeInactive ? 'all' : 'active');
        return this.apiCacheService.getOrSet(cacheKey, 3600, async ()=>{
            const groups = await this.productCategoryRepository.findAllGroupsWithCategories({
                includeInactive
            });
            return {
                groups: groups.map((group)=>this.formatGroup(group))
            };
        });
    }
    async findGroupByCode(code) {
        const group = await this.productCategoryRepository.findGroupByCode(code);
        if (!group) {
            throw new _common.NotFoundException(`Category group '${code}' not found`);
        }
        return this.formatGroup(group);
    }
    async seedCatalogCategories() {
        let groupsSeeded = 0;
        let categoriesSeeded = 0;
        for (const groupSeed of _productcategoryseed.PRODUCT_CATEGORY_GROUP_SEED){
            const group = await this.productCategoryRepository.upsertGroup(groupSeed);
            groupsSeeded += 1;
            for (const categorySeed of groupSeed.categories || []){
                await this.productCategoryRepository.upsertCategory(group.id, categorySeed);
                categoriesSeeded += 1;
            }
        }
        this.logger.log(`Product categories seeded | groups=${groupsSeeded} categories=${categoriesSeeded}`);
        return {
            message: 'Product categories seeded successfully',
            groupsSeeded,
            categoriesSeeded
        };
    }
    formatGroup(group) {
        return {
            id: group.id,
            code: group.code,
            name: group.name,
            description: group.description,
            sortOrder: group.sort_order,
            isActive: group.is_active,
            categories: (group.categories || []).map((category)=>this.formatCategory(category)),
            createdAt: group.created_at,
            updatedAt: group.updated_at
        };
    }
    formatCategory(category) {
        return {
            id: category.id,
            groupId: category.group_id,
            slug: category.slug,
            name: category.name,
            sortOrder: category.sort_order,
            isActive: category.is_active,
            createdAt: category.created_at,
            updatedAt: category.updated_at
        };
    }
};
ProductCategoryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_productcategoryrepository.ProductCategoryRepository)),
    _ts_param(1, (0, _common.Inject)(_apicacheservice.ApiCacheService)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0,
        void 0
    ])
], ProductCategoryService);

//# sourceMappingURL=product-category.service.js.map