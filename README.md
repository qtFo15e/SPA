
<body>
<h1>水质管理系统——单页web应用，数据可视化</h1>
<section>
    <h2>项目主要内容</h2>
    <ol>
        <li><strong>水质分析:</strong>对三维水质数据（时间，地点，监测项）， 进行两个维度的报表分析（表格，图形）</li>
        <li><strong>水质实时数据:</strong>以地图为基础，获取对应地点的数据，与水质标准做简略比较</li>
        <li><strong>待机主题动画:</strong>CSS3实现</li>
        <li><strong>登录，注册页面:</strong>默认账户： abc@qq.com  密码：123456</li>
        <li><strong>数据上传:</strong>允许用户上传数据，格式要求 .cvs (仅实现前端部分)</li>
        <li><strong>自定义水质标准</strong></li>
    </ol>
</section>
<setion>
    <h2>项目解决方案</h2>
    <ol>
        <li>
            <strong>前端:</strong>
            <ul>
                <li>underscore.js( 函数式编程处理数据 )</li>
                <li>backbone.js（MVC分层）</li>
                <li>two.js（canvas插件）</li>
                <li>jQuery（DOM操作）</li>
                <li>chart.js（图表canvas插件）</li>
                <li>bootstrap（UI和基本组件）</li>
                <li>其他jQuery，bootstrap插件</li>
            </ul>
        </li>
        <li><strong>后端:</strong>node.js</li>
        <li><strong>数据库:</strong>mongoDB</li>
    </ol>
</setion>
<section>
    <h3>其他</h3>
    <ol>
        <li>基本实现Bootstrap的CSS部分(LESS方式)</li>
        <li>基本实现Bootstrap的js部分</li>
        <li>未完全替换Bootstrap的原因:由于实现思路及完成度不同，对原有库还存在依赖，主体功能不受影响</li>
    </ol>
</section>
<section>
    <h4>未做兼容性特殊处理，推荐在chrome或新版本浏览器中运行</h4>
</section>
<section>
     <h5>作品展示视频</h5><a> http://pan.baidu.com/s/1bK0QFs </a>
</section>
</body>
</html>
