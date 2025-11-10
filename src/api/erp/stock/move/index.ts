import request from '@/config/axios'

// ERP 库存调拨单项 VO
export interface StockMoveItemVO {
  id?: number // 调拨项编号
  fromWarehouseId?: number // 调出仓库编号
  fromWarehouseName?: string // 调出仓库名称（展示）
  toWarehouseId?: number // 调入仓库编号
  toWarehouseName?: string // 调入仓库名称（展示）
  productId?: number // 产品编号
  productName?: string // 产品名称（展示）
  productUnitName?: string // 产品单位名称（展示）
  productBarCode?: string // 产品条码（展示）
  productPrice?: number // 产品单价
  count?: number // 数量
  totalPrice?: number // 金额
  remark?: string // 备注
  fromPurchaseInItemId?: number // 调出批次
  fromBatchName?: string // 调出批次名称（展示）
  toPurchaseInItemId?: number // 调入批次
  toBatchName?: string // 调入批次名称（展示）
  manageTypeFrom?: number // 调出方管理类型：10-分类 20-批次 30-一物一码
  manageTypeTo?: number // 调入方管理类型
  uniqueCodes?: string[] // 一物一码列表
  stockCount?: number // 库存数量（展示）
  productUnitId?: number // 单位编号（展示）
  originPurchasePrice?: number // 参考采购单价
  fromStocks?: any[] // 调出库存明细（前端使用）
  fromAvailableStocks?: any[] // 调出库存明细原始数据（前端使用）
  fromBatchWarehouses?: any[] // 调出批次对应的仓库数据（前端使用）
  toStocks?: any[] // 调入库存明细（前端使用）
}

// ERP 库存调拨解析请求 VO
export interface StockMoveParseUniqueCodesReq {
  codes: string[]
  deptId: number // 调出单位
  toDeptId: number // 调入单位
}

// ERP 库存调拨解析响应 VO
export interface StockMoveItemParseRespVO {
  fromWarehouseId: number
  fromWarehouseName?: string
  productId: number
  productName?: string
  productBarCode?: string
  productUnitName?: string
  productUnitId?: number
  fromPurchaseInItemId?: number
  fromBatchName?: string
  uniqueCodes: string[]
  count: number
  manageTypeFrom?: number
  manageTypeTo?: number
  productPrice?: number
  originPurchasePrice?: number
  validationStatus?: 'success' | 'warning' | 'error'
  validationMessage?: string
}

// ERP 库存调拨单 VO
export interface StockMoveVO {
  id?: number // 调拨编号
  no?: string // 调拨单号
  moveTime?: number | string // 调拨时间
  totalCount?: number // 合计数量
  totalPrice?: number // 合计金额
  status?: number // 状态
  remark?: string // 备注
  deptId: number // 调出单位
  toDeptId: number // 调入单位
  fileUrl?: string | string[] // 附件
  customerId?: number // 客户编号（保留后台字段）
  items: StockMoveItemVO[] // 明细列表
}

// ERP 库存调拨单 API
export const StockMoveApi = {
  // 查询库存调度单分页
  getStockMovePage: async (params: any) => {
    return await request.get({ url: `/erp/stock-move/page`, params })
  },

  // 查询库存调度单详情
  getStockMove: async (id: number) => {
    return await request.get({ url: `/erp/stock-move/get?id=` + id })
  },

  // 新增库存调度单
  createStockMove: async (data: StockMoveVO) => {
    return await request.postOriginal({ url: `/erp/stock-move/create`, data })
  },

  // 修改库存调度单
  updateStockMove: async (data: StockMoveVO) => {
    return await request.putOriginal({ url: `/erp/stock-move/update`, data })
  },

  // 更新库存调度单的状态
  updateStockMoveStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-move/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 解析一物一码列表，生成调拨行明细
  parseUniqueCodesForStockMove: async (data: StockMoveParseUniqueCodesReq) => {
    return await request.post<StockMoveItemParseRespVO[]>({
      url: `/erp/stock-move/parse-unique-codes`,
      data
    })
  },

  // 删除库存调度单
  deleteStockMove: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-move/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出库存调度单 Excel
  exportStockMove: async (params) => {
    return await request.download({ url: `/erp/stock-move/export-excel`, params })
  }
}
