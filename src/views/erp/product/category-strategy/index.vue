<template>
  <doc-alert
    title="ERP 产品"
    path="/erp/product"
  />

  <ContentWrap>
    <!-- 搜索 -->
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <!-- 产品分类选择下拉框 tree 控件 -->
      <el-form-item label="产品分类" prop="pcId">
        <el-tree-select
          v-model="queryParams.pcId"
          :data="productCategoryTreeData"
          :props="defaultProps"
          :render-after-expand="false"
          node-key="id"
          check-strictly
          clearable
          filterable
          style="width: 240px"
        />
      </el-form-item>
      <!-- 部门选择下拉框 tree 控件 -->
      <el-form-item label="部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptIdTreeData"
          :props="deptProps"
          :render-after-expand="false"
          node-key="id"
          check-strictly
          clearable
          filterable
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item label="管理类型" prop="manageType">
        <el-select
          v-model="queryParams.manageType"
          placeholder="请选择管理类型"
          clearable
          filterable
          style="width: 240px"
        >
          <el-option
            v-for="dict in productCategoryManageType"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

    </el-form>
  </ContentWrap>

  <!-- 操作工具栏 -->
  <ContentWrap>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px"/>
          搜索
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px"/>
          重置
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          @click="handleAdd"
          v-hasPermi="['erp:product-category-strategy:create']"
        >
          <Icon icon="ep:plus" class="mr-5px"/>
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['erp:product-category-strategy:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px"/>
          删除
        </el-button>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-table
      v-loading="loading"
      :data="list"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="产品分类" align="center" prop="pcName"/>
      <el-table-column label="部门" align="center" prop="deptName"/>
      <el-table-column label="管理类型" align="center" prop="manageType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ERP_PRODUCT_CATEGORY_MANAGEMENT_TYPE"
                    :value="scope.row.manageType"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ formatDate(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200"
                       class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['erp:product-category-strategy:update']"
            :disabled="!scope.row.pcId || !canCustomizeStrategy(scope.row.pcId)"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
            v-hasPermi="['erp:product-category-strategy:delete']"
            :disabled="!scope.row.pcId || !canCustomizeStrategy(scope.row.pcId)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ProductCategoryStrategyForm ref="formRef" @success="getList"/>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {
  ProductCategoryStrategyApi,
  ProductCategoryStrategyVO
} from '@/api/erp/product/category-strategy'
import {ProductCategoryApi, ProductCategoryVO} from '@/api/erp/product/category'
import * as DeptApi from '@/api/system/dept'
import {ElMessage, ElMessageBox} from 'element-plus'
import {DICT_TYPE, getDictOptions} from '@/utils/dict'
import {formatDate} from '@/utils/formatTime'
import {handleTree} from '@/utils/tree'
import ProductCategoryStrategyForm from './ProductCategoryStrategyForm.vue'

// 字典
const productCategoryManageType = getDictOptions(DICT_TYPE.ERP_PRODUCT_CATEGORY_MANAGEMENT_TYPE)

// ========== Refs ==========
const formRef = ref() // 表单组件 Ref
const loading = ref(false)
const total = ref(0)
const list = ref<ProductCategoryStrategyVO[]>([])
const single = ref(true)
const multiple = ref(true)

// 产品分类树和部门树相关数据
const productCategoryTreeData = ref<ProductCategoryVO[]>([]) // 产品分类列表
const deptIdTreeData = ref<any[]>([])
const defaultProps = {
  children: 'children',
  label: 'name',
  disabled: (data) => data.coerceManageType !== 1
}
const deptProps = {
  children: 'children',
  label: 'name'
}

// 搜索参数
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  pcId: null,
  deptId: null,
  manageType: null
})

// ========== 方法 ==========
/** 查询产品分类树 */
const getProductCategoryTree = async () => {
  try {
    const res = await ProductCategoryApi.getProductCategorySimpleList()
    productCategoryTreeData.value = handleTree(res, 'id', 'parentId')
  } catch (error) {
    console.error('获取产品分类树失败:', error)
  }
}

/** 查询部门树 */
const getDeptTree = async () => {
  try {
    const data = await DeptApi.getSimpleDeptList()
    deptIdTreeData.value = handleTree(data)
  } catch (error) {
    console.error('获取部门树失败:', error)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const response = await ProductCategoryStrategyApi.getProductCategoryStrategyList(queryParams.value)
    list.value = response.list
    total.value = response.total
  } finally {
    loading.value = false
  }
}

/** 检查产品分类是否可以自定义策略 */
const canCustomizeStrategy = async (pcId?: number) => {
  try {
    if (!pcId) {
      return false
    }
    const response = await ProductCategoryStrategyApi.checkCanCustomizeStrategy(pcId)
    return response
  } catch (error) {
    console.error('检查产品分类是否可以自定义策略失败:', error)
    return false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  // 重置表单
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    pcId: null,
    deptId: null,
    manageType: null
  }
  handleQuery()
}

/** 选择行 */
const handleSelectionChange = (selection: any) => {
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  formRef.value.open('create')
}

/** 修改按钮操作 */
const handleUpdate = async (row: any) => {
  if (!row.pcId) {
    ElMessage.error('产品分类编号不能为空')
    return
  }
  const canCustomize = await canCustomizeStrategy(row.pcId)
  if (!canCustomize) {
    ElMessage.error('该产品分类为强制管理模式，不能自定义管理策略')
    return
  }

  formRef.value.open('update', row.id)
}

/** 删除按钮操作 */
const handleDelete = (row: any) => {
  const ids = [row.id]
  ElMessageBox.confirm('是否确认删除产品分类管理策略编号为"' + ids + '"的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await ProductCategoryStrategyApi.deleteProductCategoryStrategy(ids[0])
    ElMessage.success('删除成功')
    await getList()
  })
}

// ========== 初始化 ==========
onMounted(async () => {
  await Promise.all([
    getProductCategoryTree(),
    getDeptTree()
  ])
  getList()
})
</script>

<style scoped>
.btn-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
