import request from '@/config/axios'

// ERP 其它出库单 VO
export interface StockOutVO {
  id: number // 出库编号
  no: string // 出库单号
  customerId: number // 客户编号
  outTime: Date // 出库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  deptId: number // 部门编号
  bizType?: number // 业务类型：20-其他出库, 92-报修出库, 100-送修出库
  items?: StockOutItemVO[] // 出库明细列表
}

// ERP 其它出库单明细 VO
export interface StockOutItemVO {
  id?: number // 出库项编号
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

// ERP 其它出库单 API
export const StockOutApi = {
  // 查询其它出库单分页
  getStockOutPage: async (params: any) => {
    return await request.get({ url: `/erp/stock-out/page`, params })
  },

  // 查询其它出库单详情
  getStockOut: async (id: number) => {
    return await request.get({ url: `/erp/stock-out/get?id=` + id })
  },

  // 新增其它出库单
  createStockOut: async (data: StockOutVO) => {
    return await request.post({ url: `/erp/stock-out/create`, data })
  },

  // 修改其它出库单
  updateStockOut: async (data: StockOutVO) => {
    return await request.put({ url: `/erp/stock-out/update`, data })
  },

  // 更新其它出库单的状态
  updateStockOutStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-out/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除其它出库单
  deleteStockOut: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-out/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出其它出库单 Excel
  exportStockOut: async (params) => {
    return await request.download({ url: `/erp/stock-out/export-excel`, params })
  },

  // 查询可用的一物一码列表（用于其他出库）
  getAvailableUniqueCodesForStockOut: async (params: {
    warehouseId?: number
    productId: number
    purchaseInItemId: number
    deptId: number
  }) => {
    return await request.get({ url: `/erp/stock-out/available-unique-codes`, params })
  },

  // 根据一物一码列表解析并拆分出库项（用于其他出库）
  parseUniqueCodesForStockOut: async (data: {
    codes: string[]
    deptId: number
    bizType: number
  }) => {
    return await request.post({ url: `/erp/stock-out/parse-unique-codes`, data })
  }
}
