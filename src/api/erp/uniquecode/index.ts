import request from '@/config/axios'

/**
 * ERP 一物一码 VO
 */
export interface UniqueCodeVO {
  id: number // 编号
  code: string // 唯一码
  productId: number // 产品编号
  productName: string // 产品名称
  purchaseInItemId: number // 采购入库项编号（批次ID）
  status: number // 状态：1-在库 2-已出库 3-已销售 4-已退货 5-已报废 6-盘亏 7-已作废 8-上车 9-送修
  currentWarehouseId: number // 当前所在仓库编号
  currentDeptId: number // 当前所属部门编号
  warrantyPeriodDays?: number // 保修天数
  purchaseInDate?: string // 入库日期
  supplierId?: number // 供应商编号
  purchasePrice?: number // 采购单价
  customerId?: number // 客户编号
  remark?: string // 备注
  warehouseName?: string // 仓库名称
  deptName?: string // 部门名称
  batchName?: string // 批次名称
}

/**
 * ERP 一物一码记录明细 VO
 */
export interface UniqueCodeRecordVO {
  id: number // 记录编号
  uniqueCodeId: number // 一物一码编号
  code: string // 唯一码
  productId: number // 产品编号
  productName?: string // 产品名称
  bizType: number // 业务类型
  bizTypeName?: string // 业务类型名称
  bizId?: number // 业务单据编号
  bizItemId?: number // 业务单据项编号
  bizNo?: string // 业务单号
  beforeStatus?: number // 操作前状态
  beforeWarehouseId?: number // 操作前仓库编号
  beforeWarehouseName?: string // 操作前仓库名称
  beforeDeptId?: number // 操作前部门编号
  beforeDeptName?: string // 操作前部门名称
  afterStatus?: number // 操作后状态
  afterWarehouseId?: number // 操作后仓库编号
  afterWarehouseName?: string // 操作后仓库名称
  afterDeptId?: number // 操作后部门编号
  afterDeptName?: string // 操作后部门名称
  count?: number // 数量
  supplierId?: number // 供应商编号
  supplierName?: string // 供应商名称
  customerId?: number // 客户编号
  customerName?: string // 客户名称
  operationTime?: string // 操作时间
  remark?: string // 备注
}

/**
 * ERP 一物一码 API
 */
export const UniqueCodeApi = {
  /**
   * 查询在库的一物一码列表（用于采购退货选择）
   */
  getInStockUniqueCodeList: async (params: {
    productId: number
    warehouseId: number
    purchaseInItemId: number
    deptId: number
  }) => {
    return await request.get({ url: `/erp/unique-code/in-stock-list`, params })
  },

  /**
   * 根据唯一码列表查询一物一码详细信息（用于详情页查看）
   */
  getUniqueCodeListByCodes: async (codes: string[]) => {
    // 将数组转换为逗号分隔的字符串，避免 GET 请求参数序列化问题
    const codesStr = codes.join(',')
    return await request.get({ url: `/erp/unique-code/by-codes`, params: { codes: codesStr } })
  },

  /**
   * 查询一物一码分页
   */
  getUniqueCodePage: async (params: any) => {
    return await request.get({ url: `/erp/unique-code/page`, params })
  },

  /**
   * 查询一物一码记录明细分页
   */
  getUniqueCodeRecordPage: async (params: any) => {
    return await request.get({ url: `/erp/unique-code-record/page`, params })
  }
}
