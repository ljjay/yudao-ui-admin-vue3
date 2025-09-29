import request from '@/config/axios'

// ERP 产品分类管理策略 VO
export interface ProductCategoryStrategyVO {
  id: number // 分类编号
  pcId: number // 产品分类编号
  pcName: number // 产品分类名称
  deptId: number // 部门编号
  deptName: number // 部门名称
  manageType: number // 管理类型
}

// ERP 产品分类管理策略 API
export const ProductCategoryStrategyApi = {
  // 查询产品分类管理策略列表
  getProductCategoryStrategyList: async (params: any) => {
    return await request.get({ url: `/erp/product-category-strategy/page`, params })
  },

  // 查询产品分类管理策略详情
  getProductCategoryStrategy: async (id: number) => {
    return await request.get({ url: `/erp/product-category-strategy/get?id=` + id })
  },

  // 查询产品分类管理策略详情（通过产品分类ID）
  getProductCategoryStrategyByPcId: async (pcId: number) => {
    return await request.get({ url: `/erp/product-category-strategy/get-by-pc-id?pcId=` + pcId })
  },

  // 检查产品分类是否可以自定义管理策略
  checkCanCustomizeStrategy: async (pcId: number) => {
    return await request.get({ url: `/erp/product-category-strategy/check-can-customize?pcId=` + pcId })
  },

  // 新增产品分类管理策略
  createProductCategoryStrategy: async (data: ProductCategoryStrategyVO) => {
    return await request.post({ url: `/erp/product-category-strategy/create`, data })
  },

  // 修改产品分类管理策略
  updateProductCategoryStrategy: async (data: ProductCategoryStrategyVO) => {
    return await request.put({ url: `/erp/product-category-strategy/update`, data })
  },

  // 删除产品分类管理策略
  deleteProductCategoryStrategy: async (id: number) => {
    return await request.delete({ url: `/erp/product-category-strategy/delete?id=` + id })
  }
}
