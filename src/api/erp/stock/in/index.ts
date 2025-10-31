import request from '@/config/axios'

// ERP 其它入库单 VO
export interface StockInVO {
  id: number // 入库编号
  no: string // 入库单号
  supplierId: number // 供应商编号
  inTime: Date // 入库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  deptId: number // 部门编号
  bizType?: number // 业务类型：10-其他入库, 90-报修入库, 102-收修入库
  items?: StockInItemVO[] // 入库明细列表
}

// ERP 其它入库单明细 VO
export interface StockInItemVO {
  id?: number // 入库项编号
  warehouseId: number // 仓库编号
  productId: number // 产品编号
  productUnitName?: string // 产品单位名称
  productBarCode?: string // 产品条码
  count: number // 产品数量
  price: number // 产品单价，单位：元
  totalPrice?: number // 总价，单位：元
  remark?: string // 备注
  purchaseInItemId?: number // 采购入库项编号（批次ID）
  batchName?: string // 批次名称（只读，从后端返回）
  uniqueCodes?: string[] // 一物一码列表
}

// ERP 其它入库单 API
export const StockInApi = {
  // 查询其它入库单分页
  getStockInPage: async (params: any) => {
    return await request.get({ url: `/erp/stock-in/page`, params })
  },

  // 查询其它入库单详情
  getStockIn: async (id: number) => {
    return await request.get({ url: `/erp/stock-in/get?id=` + id })
  },

  // 新增其它入库单
  createStockIn: async (data: StockInVO) => {
    return await request.post({ url: `/erp/stock-in/create`, data })
  },

  // 修改其它入库单
  updateStockIn: async (data: StockInVO) => {
    return await request.put({ url: `/erp/stock-in/update`, data })
  },

  // 更新其它入库单的状态
  updateStockInStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-in/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除其它入库单
  deleteStockIn: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-in/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出其它入库单 Excel
  exportStockIn: async (params) => {
    return await request.download({ url: `/erp/stock-in/export-excel`, params })
  },

  // 根据一物一码列表解析并拆分入库项（用于其他入库）
  parseUniqueCodesForStockIn: async (data: {
    codes: string[]
    deptId: number
    bizType: number
  }) => {
    return await request.post({ url: `/erp/stock-in/parse-unique-codes`, data })
  }
}
