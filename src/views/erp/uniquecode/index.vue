<!-- ERP 一物一码查询 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="单位" prop="currentDeptId">
        <el-tree-select
          v-model="queryParams.currentDeptId"
          :data="deptIdTreeData"
          :props="defaultProps"
          :render-after-expand="false"
          check-on-click-node
          check-strictly
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="唯一码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入唯一码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="queryParams.productId"
          clearable
          filterable
          placeholder="请选择产品"
          class="!w-240px"
        >
          <el-option
            v-for="item in productList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库" prop="currentWarehouseId">
        <el-select
          v-model="queryParams.currentWarehouseId"
          clearable
          filterable
          placeholder="请选择仓库"
          class="!w-240px"
        >
          <el-option
            v-for="item in warehouseList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.ERP_UNIQUE_CODE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="单位" align="center" prop="deptName" />
      <el-table-column label="唯一码" align="center" prop="code" min-width="150" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="批次" align="center" prop="batchName" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ERP_UNIQUE_CODE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="当前仓库" align="center" prop="warehouseName" />
      <el-table-column label="保修天数" align="center" prop="warrantyPeriodDays" />
      <el-table-column label="入库日期" align="center" prop="purchaseInDate" width="110" />
      <el-table-column
        label="采购单价"
        align="center"
        prop="purchasePrice"
        :formatter="erpPriceTableColumnFormatter"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { UniqueCodeApi, UniqueCodeVO } from '@/api/erp/uniquecode'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { erpPriceTableColumnFormatter } from '@/utils'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'

/** ERP 一物一码查询 */
defineOptions({ name: 'ErpUniqueCode' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<UniqueCodeVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  productId: undefined,
  currentWarehouseId: undefined,
  currentDeptId: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const productList = ref<ProductVO[]>([]) // 产品列表
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const deptIdTreeData = ref<any[]>([]) // 部门树形结构

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UniqueCodeApi.getUniqueCodePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.currentDeptId = undefined
  handleQuery()
}

/** 获取有权限的部门 */
const getDeptIdTreeData = async () => {
  deptIdTreeData.value = handleTree(await DeptApi.getSimpleDeptList())
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载有权限的部门
  await getDeptIdTreeData()
  // 加载产品、仓库列表
  productList.value = await ProductApi.getProductSimpleList()
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
})
</script>

