import request from '@/config/axios'

// ERP 库存盘点单 VO
export interface StockCheckVO {
  id: number // 出库编号
  no: string // 出库单号
  outTime: Date // 出库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  deptId: number // 部门编号
  items?: StockCheckItemVO[] // 盘点项列表
}

// ERP 库存盘点项 VO
export interface StockCheckItemVO {
  id?: number // 盘点项编号
  warehouseId: number // 仓库编号
  productId: number // 产品编号
  productPrice?: number // 产品单价
  stockCount: number // 账面数量（当前库存）
  actualCount: number // 实际数量（实际库存）
  count: number // 盈亏数量
  purchaseInItemId?: number // 批次编号（采购入库项ID）
  batchName?: string // 批次名称
  uniqueCodes?: string[] // 一物一码列表
  manageType?: number // 产品管理类型（10-分类，20-批次，30-一物一码）
  remark?: string // 备注
  // 关联字段
  productName?: string // 产品名称
  productBarCode?: string // 产品条码
  productUnitName?: string // 产品单位名称
}

// 批量解析一物一码 Request VO
export interface ParseUniqueCodesReq {
  codes: string[] // 一物一码列表
  deptId: number // 部门编号
}

// 批量解析一物一码 Response VO
export interface ParseUniqueCodesResp {
  productId: number // 产品编号
  productName: string // 产品名称
  productBarCode: string // 产品条码
  productUnitId: number // 产品单位编号
  productUnitName: string // 产品单位名称
  manageType: number // 产品管理类型
  warehouseId: number // 仓库编号
  warehouseName: string // 仓库名称
  purchaseInItemId?: number // 批次编号
  batchName?: string // 批次名称
  stockCount: number // 账面数量
  actualCount: number // 实际数量
  count: number // 盈亏数量
  uniqueCodes: string[] // 一物一码列表
}

// ERP 库存盘点单 API
export const StockCheckApi = {
  // 查询库存盘点单分页
  getStockCheckPage: async (params: any) => {
    return await request.get({ url: `/erp/stock-check/page`, params })
  },

  // 查询库存盘点单详情
  getStockCheck: async (id: number) => {
    return await request.get({ url: `/erp/stock-check/get?id=` + id })
  },

  // 新增库存盘点单
  createStockCheck: async (data: StockCheckVO) => {
    return await request.post({ url: `/erp/stock-check/create`, data })
  },

  // 修改库存盘点单
  updateStockCheck: async (data: StockCheckVO) => {
    return await request.put({ url: `/erp/stock-check/update`, data })
  },

  // 更新库存盘点单的状态
  updateStockCheckStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-check/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除库存盘点单
  deleteStockCheck: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-check/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出库存盘点单 Excel
  exportStockCheck: async (params) => {
    return await request.download({ url: `/erp/stock-check/export-excel`, params })
  },

  // 批量解析一物一码（库存盘点）
  parseUniqueCodesForCheck: async (data: ParseUniqueCodesReq) => {
    return await request.post({ url: `/erp/stock-check/parse-unique-codes`, data })
  }
}
