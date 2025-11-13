import request from '@/config/axios'

/**
 * ERP 产品库存 VO
 *
 * 支持三种库存管理模式:
 * - 普通管理: 按产品+仓库维度管理,purchaseInItemId为空
 * - 批次管理: 按产品+仓库+批次维度管理,purchaseInItemId记录批次
 * - 一物一码: 按产品+仓库+唯一码维度管理,purchaseInItemId记录唯一码
 */
export interface StockVO {
  id: number // 编号
  productId: number // 产品编号
  warehouseId: number // 仓库编号
  count: number // 库存数量
  deptId: number // 部门编码
  purchaseInItemId?: number // 采购入库项编号(批次ID/唯一码ID)
  batchName?: string // 批次名称(前端展示用)
}

/**
 * ERP 产品库存 API
 *
 * 提供库存查询和管理接口
 */
export const StockApi = {
  /**
   * 查询产品库存分页
   *
   * @param params 分页查询参数(可按产品、仓库、部门筛选)
   * @returns 分页结果
   */
  getStockPage: async (params: any) => {
    return await request.get({ url: `/erp/stock/page`, params })
  },

  /**
   * 查询产品库存详情(按ID)
   *
   * @param id 库存记录编号
   * @returns 库存详情
   */
  getStock: async (id: number) => {
    return await request.get({ url: `/erp/stock/get?id=` + id })
  },

  /**
   * 查询产品库存详情(支持批次查询)
   *
   * 用于批次管理和一物一码管理场景
   *
   * @param productId 产品编号
   * @param warehouseId 仓库编号
   * @param purchaseInItemId 采购入库项编号(可选,用于批次管理)
   * @returns 库存详情
   */
  getStock2: async (productId: number, warehouseId: number, purchaseInItemId?: number) => {
    return await request.get({ url: `/erp/stock/get`, params: { productId, warehouseId, purchaseInItemId } })
  },

  /**
   * 获得产品库存数量(全部仓库总和)
   *
   * @param productId 产品编号
   * @returns 库存总数量
   */
  getStockCount: async (productId: number) => {
    return await request.get({ url: `/erp/stock/get-count`, params: { productId } })
  },

  /**
   * 获得产品库存数量(按部门统计)
   *
   * @param productId 产品编号
   * @param deptId 部门编号
   * @returns 该部门的库存总数量
   */
  getStockCountByDept: async (productId: number , deptId: number) => {
    return await request.get({ url: `/erp/stock/get-count-by-dept`, params: { productId, deptId} })
  },

  /**
   * 导出产品库存 Excel
   *
   * @param params 查询参数
   * @returns Excel文件流
   */
  exportStock: async (params) => {
    return await request.download({ url: `/erp/stock/export-excel`, params })
  },

  /**
   * 获取产品的可用库存信息(用于出入库操作)
   *
   * 根据产品的管理类型,返回不同维度的库存:
   * - 普通管理: 返回库存>0的记录
   * - 批次管理/一物一码: 返回所有有批次ID的记录(允许库存为0)
   *
   * @param productId 产品编号
   * @param deptId 部门编号
   * @returns 可用库存列表,用于前端出入库表单选择
   */
  getProductStockForOperation: async (productId: number, deptId: number) => {
    return await request.get({
      url: `/erp/stock/get-product-stock-for-operation`,
      params: { productId, deptId }
    })
  },

  /**
   * 获取产品历史批次列表（含零库存）
   *
   * @param productId 产品编号
   * @param deptId 部门编号
   */
  getProductBatchList: async (productId: number, deptId: number) => {
    return await request.get({
      url: `/erp/stock/get-product-batch-list`,
      params: { productId, deptId }
    })
  }
}
