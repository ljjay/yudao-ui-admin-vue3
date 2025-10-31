import request from '@/config/axios'

// ERP 产品库存 VO
export interface StockVO {
  // 编号
  id: number
  // 产品编号
  productId: number
  // 仓库编号
  warehouseId: number
  // 库存数量
  count: number
  // 部门编码
  deptId: number
  // 采购入库项编号（批次ID）
  purchaseInItemId?: number
  // 批次名称
  batchName?: string
}

// ERP 产品库存 API
export const StockApi = {
  // 查询产品库存分页
  getStockPage: async (params: any) => {
    return await request.get({ url: `/erp/stock/page`, params })
  },

  // 查询产品库存详情
  getStock: async (id: number) => {
    return await request.get({ url: `/erp/stock/get?id=` + id })
  },

  // 查询产品库存详情（支持批次查询）
  getStock2: async (productId: number, warehouseId: number, purchaseInItemId?: number) => {
    return await request.get({ url: `/erp/stock/get`, params: { productId, warehouseId, purchaseInItemId } })
  },

  // 获得产品库存数量
  getStockCount: async (productId: number) => {
    return await request.get({ url: `/erp/stock/get-count`, params: { productId } })
  },

  // 获得产品库存数量
  getStockCountByDept: async (productId: number , deptId: number) => {
    return await request.get({ url: `/erp/stock/get-count-by-dept`, params: { productId, deptId} })
  },

  // 导出产品库存 Excel
  exportStock: async (params) => {
    return await request.download({ url: `/erp/stock/export-excel`, params })
  },

  // 获取产品的可用库存信息（用于出入库操作）
  getProductStockForOperation: async (productId: number, deptId: number) => {
    return await request.get({
      url: `/erp/stock/get-product-stock-for-operation`,
      params: { productId, deptId }
    })
  }
}
