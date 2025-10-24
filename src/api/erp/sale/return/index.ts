import request from '@/config/axios'

// ERP 销售退货 VO
export interface SaleReturnVO {
  id: number // 销售退货编号
  no: string // 销售退货号
  customerId: number // 客户编号
  returnTime: Date // 退货时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
  deptId: number // 部门编号
}

// ERP 销售退货 API
export const SaleReturnApi = {
  // 查询销售退货分页
  getSaleReturnPage: async (params: any) => {
    return await request.get({ url: `/erp/sale-return/page`, params })
  },

  // 查询销售退货详情
  getSaleReturn: async (id: number) => {
    return await request.get({ url: `/erp/sale-return/get?id=` + id })
  },

  // 新增销售退货
  createSaleReturn: async (data: SaleReturnVO) => {
    return await request.post({ url: `/erp/sale-return/create`, data })
  },

  // 修改销售退货
  updateSaleReturn: async (data: SaleReturnVO) => {
    return await request.put({ url: `/erp/sale-return/update`, data })
  },

  // 更新销售退货的状态
  updateSaleReturnStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/sale-return/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除销售退货
  deleteSaleReturn: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/sale-return/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出销售退货 Excel
  exportSaleReturn: async (params: any) => {
    return await request.download({ url: `/erp/sale-return/export-excel`, params })
  },

  // 根据销售订单获取可退货批次列表
  getBatchListByOrder: async (params: {
    orderId: number
    productId: number
    warehouseId: number
  }) => {
    return await request.get({ 
      url: `/erp/sale-return/batch-list-by-order`, 
      params 
    })
  },

  // 根据销售订单获取批次可退货数量
  getReturnableCountByOrder: async (params: {
    orderId: number
    productId: number
    purchaseInItemIds: number[]
  }) => {
    return await request.get({ 
      url: `/erp/sale-return/returnable-count-by-order`, 
      params: {
        ...params,
        purchaseInItemIds: params.purchaseInItemIds.join(',')
      }
    })
  },

  // 根据销售订单获取可退货一物一码详细信息
  getUniqueCodeInfoByOrder: async (params: {
    orderId: number
    productId: number
    warehouseId: number
    purchaseInItemId: number
  }) => {
    return await request.get({ 
      url: `/erp/sale-return/unique-code-info-by-order`, 
      params 
    })
  },

  // 根据批次ID获取批次名称映射
  getBatchNameMap: async (params: { purchaseInItemIds: number[] }) => {
    return await request.get({
      url: `/erp/sale-return/batch-name-map`,
      params: { purchaseInItemIds: params.purchaseInItemIds.join(',') }
    })
  }
}
