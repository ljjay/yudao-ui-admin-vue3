<!-- ERP 一物一码明细查询 -->
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
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          placeholder="请选择业务类型"
          clearable
          class="!w-240px"
        >
          <el-option label="采购入库" :value="10" />
          <el-option label="采购退货" :value="11" />
          <el-option label="销售出库" :value="20" />
          <el-option label="销售退货" :value="21" />
          <el-option label="其他入库" :value="31" />
          <el-option label="其他出库" :value="32" />
          <el-option label="库存调拨" :value="33" />
          <el-option label="库存盘点" :value="40" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务单号" prop="bizNo">
        <el-input
          v-model="queryParams.bizNo"
          placeholder="请输入业务单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="操作时间" prop="operationTime">
        <el-date-picker
          v-model="queryParams.operationTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
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
      <el-table-column label="唯一码" align="center" prop="code" min-width="150" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="业务类型" align="center" prop="bizTypeName" />
      <el-table-column label="业务单号" align="center" prop="bizNo" min-width="150" />
      <el-table-column label="操作前状态" align="center" prop="beforeStatus">
        <template #default="scope">
          <dict-tag v-if="scope.row.beforeStatus" :type="DICT_TYPE.ERP_UNIQUE_CODE_STATUS" :value="scope.row.beforeStatus" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作前仓库" align="center" prop="beforeWarehouseName" />
      <el-table-column label="操作前部门" align="center" prop="beforeDeptName" />
      <el-table-column label="操作后状态" align="center" prop="afterStatus">
        <template #default="scope">
          <dict-tag v-if="scope.row.afterStatus" :type="DICT_TYPE.ERP_UNIQUE_CODE_STATUS" :value="scope.row.afterStatus" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作后仓库" align="center" prop="afterWarehouseName" />
      <el-table-column label="操作后部门" align="center" prop="afterDeptName" />
      <el-table-column
        label="操作时间"
        align="center"
        prop="operationTime"
        :formatter="dateFormatter2"
        width="120px"
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
import { UniqueCodeApi, UniqueCodeRecordVO } from '@/api/erp/uniquecode'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { dateFormatter2 } from '@/utils/formatTime'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'

/** ERP 一物一码明细查询 */
defineOptions({ name: 'ErpUniqueCodeRecord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<UniqueCodeRecordVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  productId: undefined,
  bizType: undefined,
  bizNo: undefined,
  operationTime: []
})
const queryFormRef = ref() // 搜索的表单
const productList = ref<ProductVO[]>([]) // 产品列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UniqueCodeApi.getUniqueCodeRecordPage(queryParams)
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
  handleQuery()
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载产品列表
  productList.value = await ProductApi.getProductSimpleList()
})
</script>

