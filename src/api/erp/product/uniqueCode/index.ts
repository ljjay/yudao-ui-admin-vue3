import request from '@/config/axios'

// ERP 一物一码 VO
export interface ErpUniqueCodeVO {
  id: number // 一物一码编号
  code: string // 一物一码
  productId: number // 产品编号
  productName?: string // 产品名称
  warehouseId: number // 仓库编号（初始仓库）
  currentWarehouseId?: number // 当前仓库编号
  warehouseName?: string // 仓库名称
  purchaseInItemId: number // 采购入库项编号（批次ID）
  batchName?: string // 批次名称
  status: number // 状态：1-在库, 2-已出库, 3-已销售, 7-已作废, 8-上车, 9-送修
  deptId: number // 部门编号（初始部门）
  currentDeptId?: number // 当前部门编号
  deptName?: string // 部门名称
  bizType: number // 业务类型
  bizId: number // 业务编号
  bizItemId: number // 业务项编号
  bizNo: string // 业务单号
  remark: string // 备注
}

// ERP 一物一码 API
export const ErpUniqueCodeApi = {
  // 查询一物一码分页
  getUniqueCodePage: async (params: any) => {
    return await request.get({ url: `/erp/unique-code/page`, params })
  },

  // 根据一物一码列表查询详细信息（用于详情页查看）
  getUniqueCodeListByCodes: async (codes: string[]) => {
    // 后端接口需要逗号分隔的字符串
    return await request.get({
      url: `/erp/unique-code/by-codes`,
      params: { codes: codes.join(',') }
    })
  },

  // 查询在库的一物一码列表（用于采购退货和其他出库选择）
  getInStockUniqueCodeList: async (params: {
    productId: number
    warehouseId?: number
    purchaseInItemId: number
    deptId: number
  }) => {
    return await request.get({ url: `/erp/unique-code/in-stock-list`, params })
  },

  // 查询一物一码详情
  getUniqueCode: async (id: number) => {
    return await request.get({ url: `/erp/unique-code/get?id=` + id })
  },

  // 新增一物一码
  createUniqueCode: async (data: ErpUniqueCodeVO) => {
    return await request.post({ url: `/erp/unique-code/create`, data })
  },

  // 修改一物一码
  updateUniqueCode: async (data: ErpUniqueCodeVO) => {
    return await request.put({ url: `/erp/unique-code/update`, data })
  },

  // 删除一物一码
  deleteUniqueCode: async (id: number) => {
    return await request.delete({ url: `/erp/unique-code/delete?id=` + id })
  },

  // 导出一物一码 Excel
  exportUniqueCode: async (params) => {
    return await request.download({ url: `/erp/unique-code/export-excel`, params })
  }
}
