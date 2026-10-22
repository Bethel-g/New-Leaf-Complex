# Amharic translation review

Generated from the locale fragments in `client/src/i18n/locales/`.
Locales: `en` (English), `am` (አማርኛ) — **1240 keys** in total.

## How to review

1. Work through the tables below. Tick the **OK** column when a row reads correctly.
2. Leave a comment in the **Notes** column for anything that should change.
3. **Do not translate** the placeholders in curly braces (`{count}`, `{name}`, …) — they are
   replaced at runtime. They may move within the sentence, but must keep the same spelling.
4. Keep technical terms that are normally used in English in Ethiopian hospitals
   (IT, Wi-Fi, IP, MP4, CSV, email addresses, product names).
5. Use Amharic punctuation (፣ ፤ ።) and word order; avoid literal word-for-word renderings.
6. The key name hints at where the string appears (`section.field`).

## Summary

| Domain | Where it appears | Keys |
| --- | --- | ---: |
| `admin` | Administration, reports, suggestions review, settings | 264 |
| `auth` | Sign-in screen | 25 |
| `common` | Shared UI, profile, notifications, my assigned tickets | 235 |
| `it` | IT dashboard, ticket list and ticket detail | 89 |
| `maintenance` | Maintenance dashboard, ticket list and ticket detail | 88 |
| `multimedia` | Digital signage module | 324 |
| `nav` | Sidebar navigation labels and groups | 37 |
| `priority` | Priority values (Low, Medium, High, Critical) | 4 |
| `role` | User role names | 7 |
| `shell` | App shell, header, sidebar | 26 |
| `staff` | Staff dashboard and request forms | 104 |
| `status` | Workflow and device status values | 34 |
| `type` | Request types (IT, maintenance, suggestion) | 3 |
| **Total** | | **1240** |

## admin — Administration, reports, suggestions review, settings

### `admin.activity` (30)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.activity.action.assigned` | Assigned | ተመደቧል | ☐ | |
| 2 | `admin.activity.action.closed` | Closed | ተዘግቷል | ☐ | |
| 3 | `admin.activity.action.created` | Created | ተፈጥሯል | ☐ | |
| 4 | `admin.activity.action.login` | Logged in | ግብቷል | ☐ | |
| 5 | `admin.activity.action.loginBlocked` | Login blocked | ግባት ተከልክሏል | ☐ | |
| 6 | `admin.activity.action.loginFailed` | Login failed | ግባት አልተሳካም | ☐ | |
| 7 | `admin.activity.action.logout` | Logged out | ወጥቷል | ☐ | |
| 8 | `admin.activity.action.passwordChanged` | Password changed | የይለፍ ቃል ተቀይሯል | ☐ | |
| 9 | `admin.activity.action.priorityChanged` | Priority changed | ቅድምነት ተቀይሯል | ☐ | |
| 10 | `admin.activity.action.profileUpdated` | Profile updated | መገለጫ ተዘምኗል | ☐ | |
| 11 | `admin.activity.action.reassigned` | Reassigned | እንደገና ተመደቧል | ☐ | |
| 12 | `admin.activity.action.reopened` | Reopened | እንደገና ተከፍቷል | ☐ | |
| 13 | `admin.activity.action.resolved` | Resolved | ተፈቷል | ☐ | |
| 14 | `admin.activity.action.statusChanged` | Status changed | ሁኔታ ተቀይሯል | ☐ | |
| 15 | `admin.activity.action.workNotesAdded` | Work notes added | የሥራ ማስታወሻ ተጨምሯል | ☐ | |
| 16 | `admin.activity.aria.filterAction` | Filter by action | በእርምጃ ያጣሩ | ☐ | |
| 17 | `admin.activity.aria.search` | Search activity | እንቅስቃሴ ይፈልጉ | ☐ | |
| 18 | `admin.activity.empty.title` | No activity recorded | የተመዝግበ እንቅስቃሴ የለም | ☐ | |
| 19 | `admin.activity.filter.allActions` | All Actions | ሁሉም እርምጃዎች | ☐ | |
| 20 | `admin.activity.filter.searchPlaceholder` | Search details, action... | በዝርዝር፣ በእርምጃ ይፈልጉ... | ☐ | |
| 21 | `admin.activity.refresh` | Refresh | አድስ | ☐ | |
| 22 | `admin.activity.stat.activeUsers` | Active Users | ንቁ ተጠቃሚዎች | ☐ | |
| 23 | `admin.activity.stat.entries` | Entries Shown | የታዩ ግምገማዎች | ☐ | |
| 24 | `admin.activity.stat.sourceAddresses` | Source Addresses | የመገኛ አድራሶች | ☐ | |
| 25 | `admin.activity.subtitle` | Audit trail of important system actions | የተለዩ የሲስተም እርምጃዎች የኦዲት ትርጋት | ☐ | |
| 26 | `admin.activity.table.action` | Action | እርምጃ | ☐ | |
| 27 | `admin.activity.table.dateTime` | Date/Time | ቀን/ሰዓት | ☐ | |
| 28 | `admin.activity.table.entity` | Entity | ነገር | ☐ | |
| 29 | `admin.activity.title` | System Activity Log | የሲስተም እንቅስቃሴ መዝገብ | ☐ | |
| 30 | `admin.activity.toast.noActivityToExport` | No activity to export | ለመውጣት እንቅስቃሴ የለም | ☐ | |

### `admin.categories` (17)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.categories.action.new` | New Category | አዲስ ዘርፍ | ☐ | |
| 2 | `admin.categories.aria.delete` | Delete category | ዘርፍ አጥፋ | ☐ | |
| 3 | `admin.categories.aria.edit` | Edit category | ዘርፍ አርትዎ | ☐ | |
| 4 | `admin.categories.confirmDelete` | Delete category "{name}"? | ዘርፍ “{name}” ይጥፋ? | ☐ | |
| 5 | `admin.categories.empty` | No categories | ዘርፎች የለም | ☐ | |
| 6 | `admin.categories.error.nameRequired` | Name is required | ስም ያስፈልጋል | ☐ | |
| 7 | `admin.categories.form.name` | Category Name * | የዘርፍ ስም * | ☐ | |
| 8 | `admin.categories.form.type` | Type * | አይንድ * | ☐ | |
| 9 | `admin.categories.modal.addTitle` | Add Category | ዘርፍ ጨምር | ☐ | |
| 10 | `admin.categories.modal.editTitle` | Edit Category | ዘርፍ አርትዎ | ☐ | |
| 11 | `admin.categories.pageSubtitle` | Manage IT and maintenance categories | የአይቲና የጥገና ዘርፎችን ያስተዳደሩ | ☐ | |
| 12 | `admin.categories.pageTitle` | Category Management | የዘርፍ አስተዳደር | ☐ | |
| 13 | `admin.categories.title` | {type} Categories | {type} ዘርፎች | ☐ | |
| 14 | `admin.categories.toast.created` | Category created | ዘርፉ ተፈጥሯል | ☐ | |
| 15 | `admin.categories.toast.deleteFailed` | Failed to delete category | ዘርፉን መጥፋት አልተቻለም | ☐ | |
| 16 | `admin.categories.toast.deleted` | Category deleted | ዘርፉ ጠፍቷል | ☐ | |
| 17 | `admin.categories.toast.updated` | Category updated | ዘርፉ ተዘምኗል | ☐ | |

### `admin.dashboard` (29)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.dashboard.activity.empty` | No activity recorded yet | እስካሁን የተመዝግበ እንቅስቃሴ የለም | ☐ | |
| 2 | `admin.dashboard.activity.title` | Recent System Activity | የቅርብ የሲስተም እንቅስቃሴ | ☐ | |
| 3 | `admin.dashboard.chart.byCategory` | Requests by Category | በዘርፍ የጥያቄዎች | ☐ | |
| 4 | `admin.dashboard.chart.byDepartment` | Requests by Department | በክፍል የጥያቄዎች | ☐ | |
| 5 | `admin.dashboard.list.recentCompleted.empty` | No resolved requests in period | በደረጃ ውስጥ የተፈታ ጥያቄ የለም | ☐ | |
| 6 | `admin.dashboard.list.recentCompleted.title` | Recently Resolved / Completed | በቅርብ የተፈታቸው / የተጠናቀቀው | ☐ | |
| 7 | `admin.dashboard.list.recentSubmitted.empty` | No requests submitted in period | በደረጃ ውስጥ የገቡ ጥያቄ የለም | ☐ | |
| 8 | `admin.dashboard.list.recentSubmitted.title` | Recently Submitted | በቅርብ የገቡት | ☐ | |
| 9 | `admin.dashboard.sla.openWithinSla` | Open requests within SLA | በ SLA ውስጥ ያሉ ክፍት ጥያቄዎች | ☐ | |
| 10 | `admin.dashboard.sla.pastTarget` | {overdue} of {open} open requests are past their priority target. | ከ{open} ክፍት ጥያቄዎች {overdue} የቅድምነት ግብ ያልፈጸማቸው ናቸው። | ☐ | |
| 11 | `admin.dashboard.sla.title` | SLA Performance | የ SLA አፈጻጸም | ☐ | |
| 12 | `admin.dashboard.sla.within24h` | Resolved within 24 hours | በ24 ሰዓት ውስጥ የተፈታ | ☐ | |
| 13 | `admin.dashboard.sla.within3d` | Resolved within 3 days | በ3 ቀን ውስጥ የተፈታ | ☐ | |
| 14 | `admin.dashboard.stat.avgResolutionTime` | Avg Resolution Time | አማካይ የመፍታት ጊዜ | ☐ | |
| 15 | `admin.dashboard.stat.criticalRequests` | Critical Requests | አስቸኳይ ጥያቄዎች | ☐ | |
| 16 | `admin.dashboard.stat.openRequests` | Open Requests | ክፍት ጥያቄዎች | ☐ | |
| 17 | `admin.dashboard.stat.overdueRequests` | Overdue Requests | ጊዜው ያለፈባቸው ጥያቄዎች | ☐ | |
| 18 | `admin.dashboard.stat.resolvedRequests` | Resolved Requests | የተፈታቸው ጥያቄዎች | ☐ | |
| 19 | `admin.dashboard.stat.totalIt` | Total IT Requests | ጠቅላላ የአይቲ ጥያቄዎች | ☐ | |
| 20 | `admin.dashboard.stat.totalMaintenance` | Total Maintenance Requests | ጠቅላላ የጥገና ጥያቄዎች | ☐ | |
| 21 | `admin.dashboard.stat.totalSuggestions` | Total Suggestions | ጠቅላላ ጥቁሶች | ☐ | |
| 22 | `admin.dashboard.subtitle` | Hospital-wide operations overview | የሆስፒታሉን አጠቃላይ የክዋኔ አጠቃለያ | ☐ | |
| 23 | `admin.dashboard.suggestions.empty` | Nothing awaiting review | የግምገማ የሚጠበቅ ምንም የለም | ☐ | |
| 24 | `admin.dashboard.suggestions.reviewAll` | Review all | ሁሉንም እይ | ☐ | |
| 25 | `admin.dashboard.suggestions.title` | Suggestions Needing Review | ግምገማ የሚያስፈልጉ ጥቁሶች | ☐ | |
| 26 | `admin.dashboard.title` | Administration Dashboard | የአስተዳደር ዳሽቦርድ | ☐ | |
| 27 | `admin.dashboard.workload.empty` | No technicians found | ቴክኒሽናን አልተገኙም | ☐ | |
| 28 | `admin.dashboard.workload.open` | {count} open | {count} ክፍት | ☐ | |
| 29 | `admin.dashboard.workload.title` | Team Workload | የቡድን የሥራ ጫና | ☐ | |

### `admin.departments` (15)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.departments.action.new` | New Department | አዲስ ክፍል | ☐ | |
| 2 | `admin.departments.aria.delete` | Delete department | ክፍል አጥፋ | ☐ | |
| 3 | `admin.departments.aria.edit` | Edit department | ክፍል አርትዎ | ☐ | |
| 4 | `admin.departments.confirmDelete` | Delete department "{name}"? | ክፍል “{name}” ይጥፋ? | ☐ | |
| 5 | `admin.departments.empty` | No departments yet | ክፍሎች እስካሁን የለም | ☐ | |
| 6 | `admin.departments.error.nameRequired` | Name is required | ስም ያስፈልጋል | ☐ | |
| 7 | `admin.departments.form.name` | Department Name * | የክፍል ስም * | ☐ | |
| 8 | `admin.departments.modal.addTitle` | Add Department | ክፍል ጨምር | ☐ | |
| 9 | `admin.departments.modal.editTitle` | Edit Department | ክፍል አርትዎ | ☐ | |
| 10 | `admin.departments.pageSubtitle` | Manage hospital departments | የሆስፒታሉ ክፍሎችን ያስተዳደሩ | ☐ | |
| 11 | `admin.departments.pageTitle` | Department Management | የክፍል አስተዳደር | ☐ | |
| 12 | `admin.departments.toast.created` | Department created | ክፍሉ ተፈጥሯል | ☐ | |
| 13 | `admin.departments.toast.deleteFailed` | Failed to delete department | ክፍሉን መጥፋት አልተቻለም | ☐ | |
| 14 | `admin.departments.toast.deleted` | Department deleted | ክፍሉ ጠፍቷል | ☐ | |
| 15 | `admin.departments.toast.updated` | Department updated | ክፍሉ ተዘምኗል | ☐ | |

### `admin.filter` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.filter.allDepartments` | All Departments | ሁሉም ክፍሎች | ☐ | |

### `admin.reports` (24)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.reports.chart.byStatus` | Requests by Status | በሁኔታ የጥያቄዎች | ☐ | |
| 2 | `admin.reports.chart.byType` | Requests by Type | በአይንድ የጥያቄዎች | ☐ | |
| 3 | `admin.reports.chart.totalTrend` | Total Volume Trend (12 months) | የጠቅላላ መጠን ሂደት (12 ወር) | ☐ | |
| 4 | `admin.reports.chart.volumeByMonth` | Request Volume by Month (IT vs Maintenance) | በወር የጥያቄ መጠን (አይቲ እና ጥገና) | ☐ | |
| 5 | `admin.reports.export` | Export Report | መዝገብ ወደ ውጭ ላክ | ☐ | |
| 6 | `admin.reports.overdue.empty` | No overdue requests | ጊዜው ያለፈባቸው ጥያቄ የለም | ☐ | |
| 7 | `admin.reports.overdue.hint` | Measured against the SLA targets configured in Settings. | በቅንብሮች ውስጥ የተዋቀረው በ SLA ግቦች ይለካል። | ☐ | |
| 8 | `admin.reports.overdue.table.days` | Days | ቀናት | ☐ | |
| 9 | `admin.reports.overdue.table.number` | No. | ቁ. | ☐ | |
| 10 | `admin.reports.overdue.title` | Overdue / Aging Requests | ጊዜው ያለፈባቸው / የየወር ጥያቄዎች | ☐ | |
| 11 | `admin.reports.printTitle` | Operations Report | የክዋኔ መዝገብ | ☐ | |
| 12 | `admin.reports.stat.avgResolution` | Average Resolution Time | አማካይ የመፍታት ጊዜ | ☐ | |
| 13 | `admin.reports.stat.criticalOpen` | Critical Open | ክፍት አስቸኳይ ጥያቄዎች | ☐ | |
| 14 | `admin.reports.stat.overdue` | Overdue Requests | ጊዜው ያለፈባቸው ጥያቄዎች | ☐ | |
| 15 | `admin.reports.stat.total` | Total Requests | ጠቅላላ ጥያቄዎች | ☐ | |
| 16 | `admin.reports.subtitle` | Generate management reports | የማኔጅመንት መዝገቦችን ይስለቁ | ☐ | |
| 17 | `admin.reports.suggestionPipeline.empty` | No suggestions yet | ጥቁሶች እስካሁን የለም | ☐ | |
| 18 | `admin.reports.suggestionPipeline.title` | Suggestion Pipeline | የጥቁስ አሰሳሪ | ☐ | |
| 19 | `admin.reports.summary.byCategory` | Summary by Category | በዘርፍ ማጠቃለያ | ☐ | |
| 20 | `admin.reports.summary.byDepartment` | Summary by Department | በክፍል ማጠቃለያ | ☐ | |
| 21 | `admin.reports.summary.requests` | Requests | ጥያቄዎች | ☐ | |
| 22 | `admin.reports.toast.noDataToExport` | No data to export | ለመውጣት መረጃ የለም | ☐ | |
| 23 | `admin.reports.topRequesters.title` | Top Requesters | ከፍተኛ ጠያቂዎች | ☐ | |
| 24 | `admin.reports.unknownRequester` | Unknown | ያልታወቀ | ☐ | |

### `admin.requests` (10)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.requests.csv.number` | Number | ቁጥር | ☐ | |
| 2 | `admin.requests.empty.title` | No requests found | ጥያቄዎች አልተገኙም | ☐ | |
| 3 | `admin.requests.filter.searchPlaceholder` | Search by ID, title, or requester... | በመለያ፣ በርዕስ ወይም በጠያቂ ይፈልጉ... | ☐ | |
| 4 | `admin.requests.subtitle` | View all tickets and suggestions across the hospital | በሆስፒታሉ ውስጥ ያሉ ሁሉንም ትክክቶችና ጥቁሶች ይመልከቱ | ☐ | |
| 5 | `admin.requests.tab.all` | All ({count}) | ሁሉም ({count}) | ☐ | |
| 6 | `admin.requests.tab.it` | IT ({count}) | አይቲ ({count}) | ☐ | |
| 7 | `admin.requests.tab.maintenance` | Maintenance ({count}) | ጥገና ({count}) | ☐ | |
| 8 | `admin.requests.tab.suggestions` | Suggestions ({count}) | ጥቁሶች ({count}) | ☐ | |
| 9 | `admin.requests.table.number` | No. | ቁ. | ☐ | |
| 10 | `admin.requests.title` | All Requests | ሁሉም ጥያቄዎች | ☐ | |

### `admin.settings` (42)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.settings.accent.blue` | Medical blue (default) | የሕክምና ሰማንት ሰማያዊ (መምረጥ) | ☐ | |
| 2 | `admin.settings.accent.indigo` | Indigo | ኢንዲጎ | ☐ | |
| 3 | `admin.settings.accent.teal` | Teal | ቲዝል | ☐ | |
| 4 | `admin.settings.accent.violet` | Violet | ቪዮሌት | ☐ | |
| 5 | `admin.settings.aria.valueFor` | Value for {key} | የ{key} ዋጋ | ☐ | |
| 6 | `admin.settings.category.general` | General | አጠቃላይ | ☐ | |
| 7 | `admin.settings.density.comfortable` | Comfortable (default) | ምቹ (መምረጥ) | ☐ | |
| 8 | `admin.settings.density.compact` | Compact | ጥበቅ | ☐ | |
| 9 | `admin.settings.empty` | No other settings configured | ሌሎች ቅንብሮች አልተዋቀረም | ☐ | |
| 10 | `admin.settings.field.allowRequesterClosure` | Allow requesters to close their own resolved tickets | ጠያቂዎች የራሳቸውን የተፈታ ትክክቶች እንዲዝጉ ያስችላል | ☐ | |
| 11 | `admin.settings.field.brandAccent` | Brand accent | የብራንድ ሰማንት | ☐ | |
| 12 | `admin.settings.field.hospitalAddress` | Address | አድራሽ | ☐ | |
| 13 | `admin.settings.field.hospitalAddressPlaceholder` | Street, city | ጎታ፣ ከተማ | ☐ | |
| 14 | `admin.settings.field.hospitalEmail` | Contact email | የግንኙነት ኢሜይል | ☐ | |
| 15 | `admin.settings.field.hospitalEmailPlaceholder` | info@... | info@... | ☐ | |
| 16 | `admin.settings.field.hospitalName` | Hospital name | የሆስፒታሉ ስም | ☐ | |
| 17 | `admin.settings.field.hospitalNamePlaceholder` | e.g. New Leaf Complex | ለምሳሌም፦ ኒው ሊፍ ኮምፕሌክስ | ☐ | |
| 18 | `admin.settings.field.hospitalPhone` | Contact phone | የግንኙነት ስልክ | ☐ | |
| 19 | `admin.settings.field.hospitalPhonePlaceholder` | +20 ... | +20 ... | ☐ | |
| 20 | `admin.settings.field.layoutDensity` | Layout density | የአቀማቀለ ጥብቃት | ☐ | |
| 21 | `admin.settings.field.notifyNewCritical` | Alert administrators when a Critical request is raised | አስቸኳይ ጥያቄ ሲቀረብ አስተዳደሮችን ያሳውቃል | ☐ | |
| 22 | `admin.settings.field.requireResolutionNotes` | Require a resolution note when a technician resolves a ticket | ቴክኒሽናን ትክክት ሲፈታ የመፍታት ማስታወሻ እንዲሰጥ ያስገዳል | ☐ | |
| 23 | `admin.settings.field.showRequesterColumn` | Show the requester column in request tables | በጥያቄ አሠንጭቶች የጠያቂ ዓምድን ያሳይ | ☐ | |
| 24 | `admin.settings.field.slaCritical` | Critical priority target (hours) | የአስቸኳይ ቅድምነት ግብ (ሰዓት) | ☐ | |
| 25 | `admin.settings.field.slaHigh` | High priority target (days) | የከፍተኛ ቅድምነት ግብ (ቀን) | ☐ | |
| 26 | `admin.settings.field.slaLow` | Low priority target (days) | የዝቅተኛ ቅድምነት ግብ (ቀን) | ☐ | |
| 27 | `admin.settings.field.slaMedium` | Medium priority target (days) | የመካከለኛ ቅድምነት ግብ (ቀን) | ☐ | |
| 28 | `admin.settings.pageSubtitle` | Configure SLA targets, ticket rules and other system-wide options | SLA ግቦች፣ የትክክት ደንቦችና ሌሎች የሲስተም ደረጃ አማራጮችን ያዋቁ | ☐ | |
| 29 | `admin.settings.pageTitle` | System Settings | የሲስተም ቅንብሮች | ☐ | |
| 30 | `admin.settings.protected` | protected | የተጠበቀ | ☐ | |
| 31 | `admin.settings.section.appearance.description` | Brand accent and layout density applied across the application. | በመተግበሪያ ውስጥ የሚፈጸሙ የብራንድ ሰማንትና የአቀማቀለ ጥብቃት። | ☐ | |
| 32 | `admin.settings.section.appearance.title` | Appearance | ገጽታ | ☐ | |
| 33 | `admin.settings.section.hospital.description` | Shown in the application header and on printed reports. | በመተግበሪያ ርዕስና በታተበ መዝገቦች ላይ ይታያል። | ☐ | |
| 34 | `admin.settings.section.hospital.title` | Hospital Information | የሆስፒታሉ መረጃ | ☐ | |
| 35 | `admin.settings.section.sla.description` | Deadlines used to flag overdue work on dashboards and reports. | በዳሽቦርድና በመዝገቦች ላይ ጊዜው ያለፈባቸው ሥራዎችን ለመለየት የሚያገለግሉ ጊዜገኞች። | ☐ | |
| 36 | `admin.settings.section.sla.title` | SLA Targets | SLA ግቦች | ☐ | |
| 37 | `admin.settings.section.tickets.description` | Workflow rules applied by the ticket API. | በትክክት API የሚፈጸሙ የሥራ አሰሳሪ ደንቦች። | ☐ | |
| 38 | `admin.settings.section.tickets.title` | Ticket Behaviour | የትክክት ባህሪ | ☐ | |
| 39 | `admin.settings.toast.keyUpdated` | {key} updated | {key} ተዘምኗል | ☐ | |
| 40 | `admin.settings.toast.saveFailed` | Failed to save settings | ቅንብሮችን መቀመጥ አልተቻለም | ☐ | |
| 41 | `admin.settings.toast.sectionSaved` | {section} saved | {section} ተቀምጧል | ☐ | |
| 42 | `admin.settings.toast.updateFailed` | Failed to update setting | ቅንብርን ማሻሻል አልተቻለም | ☐ | |

### `admin.suggestions` (64)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.suggestions.action.accept` | Accept | ተቀብል | ☐ | |
| 2 | `admin.suggestions.action.alreadyPlanned` | Already Planned | ቀደም ብሎ ተቀድቷል | ☐ | |
| 3 | `admin.suggestions.action.close` | Close | ዝጋ | ☐ | |
| 4 | `admin.suggestions.action.forwardToDepartment` | Forward to Department | ወደ ክፍል አላክ | ☐ | |
| 5 | `admin.suggestions.action.markAssigned` | Mark Assigned | ተመደቧል ሰላምፍ | ☐ | |
| 6 | `admin.suggestions.action.markImplemented` | Mark Implemented | ተፈጽሟል ሰላምፍ | ☐ | |
| 7 | `admin.suggestions.action.reject` | Reject | ውድቅ አድርግ | ☐ | |
| 8 | `admin.suggestions.action.requestMoreInfo` | Request More Info | ተጨማሪ መረጃ ጠይቅ | ☐ | |
| 9 | `admin.suggestions.action.startImplementation` | Start Implementation | አፈጻጸም ጀምር | ☐ | |
| 10 | `admin.suggestions.action.underReview` | Under Review | በግምገማ ላይ | ☐ | |
| 11 | `admin.suggestions.aria.clearFile` | Clear file | ፋይል አጽዳ | ☐ | |
| 12 | `admin.suggestions.aria.filterDate` | Filter by date | በቀን ያጣሩ | ☐ | |
| 13 | `admin.suggestions.aria.filterDepartment` | Filter by department | በክፍል ያጣሩ | ☐ | |
| 14 | `admin.suggestions.aria.filterStaff` | Filter by responsible staff | በአስተጠባሪ አስጋር ያጣሩ | ☐ | |
| 15 | `admin.suggestions.aria.filterStatus` | Filter by status | በሁኔታ ያጣሩ | ☐ | |
| 16 | `admin.suggestions.aria.removeFile` | Remove {name} | {name} አስወግድ | ☐ | |
| 17 | `admin.suggestions.aria.search` | Search suggestions | ጥቁሶችን ይፈልጉ | ☐ | |
| 18 | `admin.suggestions.back.toMyRequests` | Back to My Requests | ወደ የእኔ ጥያቄዎች ተመለስ | ☐ | |
| 19 | `admin.suggestions.back.toSuggestions` | Back to Suggestions | ወደ ጥቁሶች ተመለስ | ☐ | |
| 20 | `admin.suggestions.comment.informationProvided` | Information provided: {info} | መረጃ ተሰጥቷል: {info} | ☐ | |
| 21 | `admin.suggestions.count` | {count} suggestions | {count} ጥቁሶች | ☐ | |
| 22 | `admin.suggestions.countOne` | {count} suggestion | {count} ጥቁስ | ☐ | |
| 23 | `admin.suggestions.detail.assignToDepartment` | Assign to Department | ወደ ክፍል መደበ | ☐ | |
| 24 | `admin.suggestions.detail.assignToStaff` | Assign Responsible Staff | አስተጠባሪ አስጋር መደበ | ☐ | |
| 25 | `admin.suggestions.detail.chooseFile` | Choose file | ፋይል ይምረጡ | ☐ | |
| 26 | `admin.suggestions.detail.commentPlaceholder` | Add a comment... | አስተያየት ጨምር... | ☐ | |
| 27 | `admin.suggestions.detail.currentStatus` | Current Status | የአሁኑ ሁኔታ | ☐ | |
| 28 | `admin.suggestions.detail.infoPlaceholder` | Add the requested details... | የተጠየቀውን ዝርዝር ጨምሩ... | ☐ | |
| 29 | `admin.suggestions.detail.infoRequiredHint` | The review team needs more information before your suggestion can proceed. Provide it below and it will return to Under Review. | ጥቁሱ ከመቀጠል በፊት የግምገማ ቡድኑ ተጨማሪ መረጃ ይፈልጋል። ከዚህ በታች ያትሙት፤ ወደ በግምገማ ላይ ይመለሳል። | ☐ | |
| 30 | `admin.suggestions.detail.infoRequiredTitle` | Action Required — Information Needed | እርምጃ ያስፈልጋል — መረጃ ያስፈልጋል | ☐ | |
| 31 | `admin.suggestions.detail.noAttachments` | No attachments | ማጣቪያዎች የለም | ☐ | |
| 32 | `admin.suggestions.detail.noHistory` | No history yet | ታሪክ እስካሁን የለም | ☐ | |
| 33 | `admin.suggestions.detail.noNextSteps` | No further workflow steps are available for this status. | ለዚህ ሁኔታ ተጨማሪ የሥራ እርምጃ የለም። | ☐ | |
| 34 | `admin.suggestions.detail.notFound` | Suggestion not found | ጥቁሱ አልተገኘም | ☐ | |
| 35 | `admin.suggestions.detail.notParticipant` | You are not part of this suggestion's conversation. | ከዚህ ጥቁስ ውይይት አንድ አይሆኑም። | ☐ | |
| 36 | `admin.suggestions.detail.nothingToUpdate` | Nothing to update from "{status}" — the review team takes it from here. | ከ“{status}” የሚያስገኝ ምንም የለም — ከዚህ የግምገማ ቡድን ይቀያል። | ☐ | |
| 37 | `admin.suggestions.detail.remove` | Remove | አስወግድ | ☐ | |
| 38 | `admin.suggestions.detail.responsibleHint` | You are responsible for this suggestion. Record progress as you carry out the agreed improvement. | ይህን ጥቁስ እርስዎ ይህታላሉ። የተስማሙትን ማሻሻያ ሲፈጸሙ ሂደቱን ይመዝግቡ። | ☐ | |
| 39 | `admin.suggestions.detail.reviewDecision` | Review Decision | የግምገማ ውሳኔ | ☐ | |
| 40 | `admin.suggestions.detail.statusHistory` | Status History | የሁኔታ ታሪክ | ☐ | |
| 41 | `admin.suggestions.detail.submitInformation` | Submit Information | መረጃ አስገባ | ☐ | |
| 42 | `admin.suggestions.detail.updateProgress` | Update Progress | ሂደት አሻሽል | ☐ | |
| 43 | `admin.suggestions.detail.upload` | Upload | ጫን | ☐ | |
| 44 | `admin.suggestions.empty.subtitle` | Staff suggestions will appear here | የአስጋር ጥቁሶች እዚህ ይታያሉ | ☐ | |
| 45 | `admin.suggestions.empty.title` | No suggestions found | ጥቁሶች አልተገኙም | ☐ | |
| 46 | `admin.suggestions.error.loadFailed` | Failed to load suggestions | ጥቁሶችን መጫን አልተቻለም | ☐ | |
| 47 | `admin.suggestions.filter.allStaff` | All Staff | ሁሉም አስጋሮች | ☐ | |
| 48 | `admin.suggestions.filter.searchPlaceholder` | Search number, title, submitter... | በቁጥር፣ በርዕስ ወይም በያስገባው ይፈልጉ... | ☐ | |
| 49 | `admin.suggestions.pageSubtitle` | Review and manage staff improvement ideas | የአስጋር ማሻሻያ አስተያየቶችን ይግምገሙና ያስተዳደሩ | ☐ | |
| 50 | `admin.suggestions.pageTitle` | Suggestions Review | የጥቁስ ግምገማ | ☐ | |
| 51 | `admin.suggestions.table.assignedDept` | Assigned Dept | የተመደበ ክፍል | ☐ | |
| 52 | `admin.suggestions.table.assignedPerson` | Assigned Person | የተመደበ ሰው | ☐ | |
| 53 | `admin.suggestions.table.number` | No. | ቁ. | ☐ | |
| 54 | `admin.suggestions.toast.attachmentAdded` | Attachment added | ማጣቪያ ተጨምሯል | ☐ | |
| 55 | `admin.suggestions.toast.attachmentRemoved` | Attachment removed | ማጣቪያ ተወግዷል | ☐ | |
| 56 | `admin.suggestions.toast.commentAdded` | Comment added | አስተያየት ተጨምሯል | ☐ | |
| 57 | `admin.suggestions.toast.commentFailed` | Failed to add comment | አስተያየት ማካተት አልተቻለም | ☐ | |
| 58 | `admin.suggestions.toast.infoFailed` | Failed to submit information | መረጃ ማስገባት አልተቻለም | ☐ | |
| 59 | `admin.suggestions.toast.infoSubmitted` | Information submitted — suggestion is under review again | መረጃ ተልኳል — ጥቁሱ እንደገና በግምገማ ላይ ነው | ☐ | |
| 60 | `admin.suggestions.toast.removeFailed` | Failed to remove attachment | ማጣቪያን ማስወግድ አልተቻለም | ☐ | |
| 61 | `admin.suggestions.toast.statusNotFound` | Under Review status not found | የበግምገማ ሁኔታ አልተገኘም | ☐ | |
| 62 | `admin.suggestions.toast.updateFailed` | Update failed | ማሻሻል አልተቻለም | ☐ | |
| 63 | `admin.suggestions.toast.updated` | Suggestion updated | ጥቁሱ ተዘምኗል | ☐ | |
| 64 | `admin.suggestions.toast.uploadFailed` | Upload failed | ጫን አልተቻለም | ☐ | |

### `admin.toast` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.toast.operationFailed` | Operation failed | ክንውን አልተከናወነም | ☐ | |

### `admin.unit` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.unit.daysLong` | days | ቀናት | ☐ | |

### `admin.users` (30)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `admin.users.action.create` | Create | ፍጠር | ☐ | |
| 2 | `admin.users.action.new` | New User | አዲስ ተጠቃሚ | ☐ | |
| 3 | `admin.users.aria.delete` | Delete user | ተጠቃሚ አጥፋ | ☐ | |
| 4 | `admin.users.aria.edit` | Edit user | ተጠቃሚ አርትዎ | ☐ | |
| 5 | `admin.users.aria.resetPassword` | Reset password | የይለፍ ቃል ዳግም አስጀምር | ☐ | |
| 6 | `admin.users.confirmDelete` | Delete user "{name}"? | ተጠቃሚ “{name}” ይጥፋ? | ☐ | |
| 7 | `admin.users.empty` | No users yet | ተጠቃሚዎች እስካሁን የለም | ☐ | |
| 8 | `admin.users.form.activeAccount` | Active account | ንቁ መለያ | ☐ | |
| 9 | `admin.users.form.department` | Department * | ክፍል * | ☐ | |
| 10 | `admin.users.form.email` | Email * | ኢሜይል * | ☐ | |
| 11 | `admin.users.form.fullName` | Full Name * | ሙሉ ስም * | ☐ | |
| 12 | `admin.users.form.newPasswordPlaceholder` | New password | አዲስ የይለፍ ቃል | ☐ | |
| 13 | `admin.users.form.password` | Password * | የይለፍ ቃል * | ☐ | |
| 14 | `admin.users.form.role` | Role * | ሚካኤ * | ☐ | |
| 15 | `admin.users.form.select` | Select | ይምረጡ | ☐ | |
| 16 | `admin.users.form.userLabel` | User: {name} | ተጠቃሚ: {name} | ☐ | |
| 17 | `admin.users.modal.createTitle` | Create User | ተጠቃሚ ፍጠር | ☐ | |
| 18 | `admin.users.modal.editTitle` | Edit User | ተጠቃሚ አርትዎ | ☐ | |
| 19 | `admin.users.modal.resetTitle` | Reset Password | የይለፍ ቃል ዳግም አስጀምር | ☐ | |
| 20 | `admin.users.pageSubtitle` | Manage system users and roles | የሲስተም ተጠቃሚዎችንና ሚካኤዎችን ያስተዳደሩ | ☐ | |
| 21 | `admin.users.pageTitle` | User Management | የተጠቃሚ አስተዳደር | ☐ | |
| 22 | `admin.users.status.active` | Active | ንቁ | ☐ | |
| 23 | `admin.users.status.inactive` | Inactive | ያልተንቃ | ☐ | |
| 24 | `admin.users.table.employeeId` | Emp. ID | የሰራተኛ ቁ. | ☐ | |
| 25 | `admin.users.toast.created` | User created | ተጠቃሚ ተፈጥሯል | ☐ | |
| 26 | `admin.users.toast.deleteFailed` | Failed to delete user | ተጠቃሚን መጥፋት አልተቻለም | ☐ | |
| 27 | `admin.users.toast.deleted` | User deleted | ተጠቃሚ ጠፍቷል | ☐ | |
| 28 | `admin.users.toast.passwordUpdateFailed` | Failed to update password | የይለፍ ቃልን ማሻሻል አልተቻለም | ☐ | |
| 29 | `admin.users.toast.passwordUpdated` | Password updated | የይለፍ ቃል ተዘምኗል | ☐ | |
| 30 | `admin.users.toast.updated` | User updated | ተጠቃሚ ተዘምኗል | ☐ | |


## auth — Sign-in screen

### `auth.brand` (3)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `auth.brand.subtitle` | Operations System | የክዋኔ ሲስተም | ☐ | |
| 2 | `auth.brand.tagline` | One place for hospital requests, maintenance and improvement ideas. | የሆስፒታል ጥያቄዎች፣ ጥገና እና ማሻሻያ አስራሽ ሃሳብ በአንድ ቦታ። | ☐ | |
| 3 | `auth.brand.title` | New Leaf Complex | ኒው ሊፍ ኮምፕሌክስ | ☐ | |

### `auth.demo` (10)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `auth.demo.admin` | Admin | አስተዳደር | ☐ | |
| 2 | `auth.demo.doctor` | Doctor | ዶክተር | ☐ | |
| 3 | `auth.demo.itSupervisor` | IT Supervisor | የአይቲ ተቆጣጠሪ | ☐ | |
| 4 | `auth.demo.itTech` | IT Tech | የአይቲ ቴክኒሽያን | ☐ | |
| 5 | `auth.demo.maintenanceSupervisor` | Maint. Sup. | የጥገና ተቆጣጠሪ | ☐ | |
| 6 | `auth.demo.maintenanceTech` | Maint. Tech | የጥገና ቴክኒሽያን | ☐ | |
| 7 | `auth.demo.nurse` | Nurse | ነርስ | ☐ | |
| 8 | `auth.demo.sharedPassword` | Shared password: | የተጋራ የይለፍ ቃል፦ | ☐ | |
| 9 | `auth.demo.sysAdmin` | Sys Admin | የሲስተም አስተዳደር | ☐ | |
| 10 | `auth.demo.toggle` | Demo accounts | የሙከራ መለያዎች | ☐ | |

### `auth.signIn` (12)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `auth.signIn.email` | Email | ኢሜይል | ☐ | |
| 2 | `auth.signIn.emailPlaceholder` | you@newleaf.com | you@newleaf.com | ☐ | |
| 3 | `auth.signIn.failed` | Login failed | መግባቢያው አልተሳካም | ☐ | |
| 4 | `auth.signIn.hidePassword` | Hide password | የይለፍ ቃል አዝባ | ☐ | |
| 5 | `auth.signIn.password` | Password | የይለፍ ቃል | ☐ | |
| 6 | `auth.signIn.secure` | Secure hospital access | የሆስፒታል ደህንነት ያለው መግባቢያ | ☐ | |
| 7 | `auth.signIn.showPassword` | Show password | የይለፍ ቃል አሳይ | ☐ | |
| 8 | `auth.signIn.submit` | Sign in | ግባ | ☐ | |
| 9 | `auth.signIn.submitting` | Signing in | በመግባቢያ ላይ | ☐ | |
| 10 | `auth.signIn.subtitle` | Use your hospital account. | የሆስፒታል መለያዎን ይጠቀሙ። | ☐ | |
| 11 | `auth.signIn.title` | Sign in | ግባ | ☐ | |
| 12 | `auth.signIn.welcome` | Welcome back | እንደምን አለህ | ☐ | |


## common — Shared UI, profile, notifications, my assigned tickets

### `common.actions` (33)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.actions.activate` | Activate | አንቃ | ☐ | |
| 2 | `common.actions.add` | Add | አክል | ☐ | |
| 3 | `common.actions.all` | All | ሁሉም | ☐ | |
| 4 | `common.actions.approve` | Approve | አጽድቅ | ☐ | |
| 5 | `common.actions.archive` | Archive | በማህደር አስቀምጥ | ☐ | |
| 6 | `common.actions.assign` | Assign | መደበ | ☐ | |
| 7 | `common.actions.back` | Back | ተመለስ | ☐ | |
| 8 | `common.actions.cancel` | Cancel | ሰርዝ | ☐ | |
| 9 | `common.actions.clear` | Clear | አጽዳ | ☐ | |
| 10 | `common.actions.close` | Close | ዝጋ | ☐ | |
| 11 | `common.actions.confirm` | Confirm | አረጋግጥ | ☐ | |
| 12 | `common.actions.deactivate` | Deactivate | አጥፋ | ☐ | |
| 13 | `common.actions.delete` | Delete | አጥፋ | ☐ | |
| 14 | `common.actions.edit` | Edit | አርትዎ | ☐ | |
| 15 | `common.actions.export` | Export | ወደ ውጭ ላክ | ☐ | |
| 16 | `common.actions.filter` | Filter | አጣራ | ☐ | |
| 17 | `common.actions.next` | Next | ቀጣይ | ☐ | |
| 18 | `common.actions.no` | No | አይ | ☐ | |
| 19 | `common.actions.previous` | Previous | ያለፈው | ☐ | |
| 20 | `common.actions.print` | Print | አትም | ☐ | |
| 21 | `common.actions.reject` | Reject | ውድቅ አድርግ | ☐ | |
| 22 | `common.actions.reply` | Reply | መልስ | ☐ | |
| 23 | `common.actions.reset` | Reset | ዳግም አስጀምር | ☐ | |
| 24 | `common.actions.resolve` | Resolve | ፈታ | ☐ | |
| 25 | `common.actions.retry` | Retry | እንደገና ሞክር | ☐ | |
| 26 | `common.actions.save` | Save | አስቀምጥ | ☐ | |
| 27 | `common.actions.search` | Search | ፈልግ | ☐ | |
| 28 | `common.actions.send` | Send | ላክ | ☐ | |
| 29 | `common.actions.submit` | Submit | አልክክ | ☐ | |
| 30 | `common.actions.unassign` | Unassign | ምስር አውጣ | ☐ | |
| 31 | `common.actions.update` | Update | አሻሽል | ☐ | |
| 32 | `common.actions.view` | View | አሳይ | ☐ | |
| 33 | `common.actions.yes` | Yes | አዎ | ☐ | |

### `common.bulkAssign` (5)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.bulkAssign.ariaLabel` | Assign selected tickets | የተመረጡ ትክክቶች መደበ | ☐ | |
| 2 | `common.bulkAssign.selectTechnician` | Select a technician... | ቴክኒሽያን ይምረጡ... | ☐ | |
| 3 | `common.bulkAssign.subtitle` | Choose the technician who should handle the selected tickets. | የተመረጡትን ትክክቶች የሚያስተናግድ ቴክኒሽያን ይምረጡ። | ☐ | |
| 4 | `common.bulkAssign.technician` | Technician | ቴክኒሽያን | ☐ | |
| 5 | `common.bulkAssign.title` | Assign {count} ticket(s) | {count} ትክክቶች መደበ | ☐ | |

### `common.comments` (2)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.comments.empty` | No comments yet | እስካሁን አስተያየት የለም | ☐ | |
| 2 | `common.comments.placeholder` | Write a comment... | አስተያየት ይጻፉ... | ☐ | |

### `common.dashboard` (2)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.dashboard.totalCount` | {count} total | ጠቅላላ {count} | ☐ | |
| 2 | `common.dashboard.viewAll` | View all | ሁሉንም እይ | ☐ | |

### `common.dateFilter` (8)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.dateFilter.custom` | Custom range | ብጁ ክፍል | ☐ | |
| 2 | `common.dateFilter.from` | From date | ከዚህ ቀን | ☐ | |
| 3 | `common.dateFilter.label` | Date range filter | የቀን ክፍል ማጣሪያ | ☐ | |
| 4 | `common.dateFilter.month` | This month | የወር ወር | ☐ | |
| 5 | `common.dateFilter.to` | To date | እስከዚህ ቀን | ☐ | |
| 6 | `common.dateFilter.toLabel` | to | እስከ | ☐ | |
| 7 | `common.dateFilter.today` | Today | ዛሬ | ☐ | |
| 8 | `common.dateFilter.week` | This week | የሳምንት ወር | ☐ | |

### `common.empty` (4)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.empty.loading` | Loading… | በመጫን ላይ… | ☐ | |
| 2 | `common.empty.noData` | No data yet | ገና ውሂብ የለም | ☐ | |
| 3 | `common.empty.noItems` | No items | ምንም የለም | ☐ | |
| 4 | `common.empty.noResults` | No results found | ውጤት አልተገኘም | ☐ | |

### `common.labels` (47)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.labels.actions` | Actions | እርምጃዎች | ☐ | |
| 2 | `common.labels.activity` | Activity | እንቅስቃሴ | ☐ | |
| 3 | `common.labels.address` | Address | አድራሽ | ☐ | |
| 4 | `common.labels.assignee` | Assigned to | የተመደበው | ☐ | |
| 5 | `common.labels.attachments` | Attachments | ማጣቪያዎች | ☐ | |
| 6 | `common.labels.category` | Category | ዘርፍ | ☐ | |
| 7 | `common.labels.command` | Command | ትዕዛድ | ☐ | |
| 8 | `common.labels.comments` | Comments | አስተያየቶች | ☐ | |
| 9 | `common.labels.created` | Created | ተፈጥሯል | ☐ | |
| 10 | `common.labels.createdBy` | Created by | የፈጠረው | ☐ | |
| 11 | `common.labels.critical` | Critical | አስቸኳይ | ☐ | |
| 12 | `common.labels.date` | Date | ቀን | ☐ | |
| 13 | `common.labels.department` | Department | ክፍል | ☐ | |
| 14 | `common.labels.description` | Description | መግለጫ | ☐ | |
| 15 | `common.labels.details` | Details | ዝርዝር | ☐ | |
| 16 | `common.labels.device` | Device | መሣሪያ | ☐ | |
| 17 | `common.labels.dueDate` | Due date | የመጨረሻ ቀን | ☐ | |
| 18 | `common.labels.duration` | Duration | ቆይታ | ☐ | |
| 19 | `common.labels.email` | Email | ኢሜይል | ☐ | |
| 20 | `common.labels.from` | From | ከ | ☐ | |
| 21 | `common.labels.group` | Group | ቡድን | ☐ | |
| 22 | `common.labels.history` | History | ታሪክ | ☐ | |
| 23 | `common.labels.ipAddress` | IP address | የአድራስ አድራስ | ☐ | |
| 24 | `common.labels.lastSeen` | Last seen | የመጨረሻ ንግግር | ☐ | |
| 25 | `common.labels.location` | Location | ቦታ | ☐ | |
| 26 | `common.labels.media` | Media | ሚዲያ | ☐ | |
| 27 | `common.labels.name` | Name | ስም | ☐ | |
| 28 | `common.labels.notes` | Notes | ማስታወሻዎች | ☐ | |
| 29 | `common.labels.options` | Options | አማራጮች | ☐ | |
| 30 | `common.labels.password` | Password | የይለፍ ቃል | ☐ | |
| 31 | `common.labels.phone` | Phone | ስልክ | ☐ | |
| 32 | `common.labels.priority` | Priority | ቅድምነት | ☐ | |
| 33 | `common.labels.reportedBy` | Reported by | የገለጸው | ☐ | |
| 34 | `common.labels.requester` | Requester | ጠያቂ | ☐ | |
| 35 | `common.labels.resolution` | Resolution | መፍትሔ | ☐ | |
| 36 | `common.labels.role` | Role | ሚካኤ | ☐ | |
| 37 | `common.labels.schedule` | Schedule | መርሃ | ☐ | |
| 38 | `common.labels.status` | Status | ሁኔታ | ☐ | |
| 39 | `common.labels.ticket` | Ticket | ትክክት | ☐ | |
| 40 | `common.labels.title` | Title | ርዕስ | ☐ | |
| 41 | `common.labels.to` | To | ወደ | ☐ | |
| 42 | `common.labels.total` | Total | ጠቅላላ | ☐ | |
| 43 | `common.labels.type` | Type | አይንድ | ☐ | |
| 44 | `common.labels.unassigned` | Unassigned | ያልተመደበ | ☐ | |
| 45 | `common.labels.updated` | Updated | ተዘምኗል | ☐ | |
| 46 | `common.labels.user` | User | ተጠቃሚ | ☐ | |
| 47 | `common.labels.waiting` | Waiting | በመጠባበቅ ላይ | ☐ | |

### `common.modal` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.modal.close` | Close dialog | ንጽጽር ዝጋ | ☐ | |

### `common.myAssigned` (17)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.myAssigned.allPriorities` | All Priorities | ሁሉም ቅድምነቶች | ☐ | |
| 2 | `common.myAssigned.allStatuses` | All Statuses | ሁሉም ሁኔታዎች | ☐ | |
| 3 | `common.myAssigned.clearFilters` | Clear filters | ማጣሪያዎችን አጽዳ | ☐ | |
| 4 | `common.myAssigned.empty.filteredSubtitle` | Try adjusting your filters | ማጣሪያዎችዎን እንደቀየሩ ይሞክሩ | ☐ | |
| 5 | `common.myAssigned.empty.filteredTitle` | No tickets match your filters | ከማጣሪያዎችዎ ጋር የሚሄድ ትክክት የለም | ☐ | |
| 6 | `common.myAssigned.empty.subtitle` | When a supervisor assigns you a ticket, it will appear here | ተቆጣጠሪ ትክክት ሲመደባዎ እዚህ ይታያል | ☐ | |
| 7 | `common.myAssigned.empty.title` | No tickets assigned to you | የእኔ ላይ የተመደበ ትክክት የለም | ☐ | |
| 8 | `common.myAssigned.exportCsv` | Export CSV | CSV ወደ ውጭ ላክ | ☐ | |
| 9 | `common.myAssigned.filterByPriority` | Filter by priority | በቅድምነት ያጣሩ | ☐ | |
| 10 | `common.myAssigned.filterByStatus` | Filter by status | በሁኔታ ያጣሩ | ☐ | |
| 11 | `common.myAssigned.noTicketsToExport` | No tickets to export | ወደ ውጭ ለመላክ ትክክት የለም | ☐ | |
| 12 | `common.myAssigned.searchLabel` | Search assigned tickets | የተመደቡ ትክክቶች ይፈልጉ | ☐ | |
| 13 | `common.myAssigned.searchPlaceholder` | Search ticket #, title... | በትክክት ቁጥር ወይም በርዕስ ይፈልጉ... | ☐ | |
| 14 | `common.myAssigned.subtitle` | Tickets currently assigned to you | አሁን የተመደቡት ትክክቶች | ☐ | |
| 15 | `common.myAssigned.summary` | {total} total · {open} open | ጠቅላላ {total} · {open} ክፍት | ☐ | |
| 16 | `common.myAssigned.title.it` | IT Tickets Assigned to Me | የእኔ የተመደቡ የአይቲ ትክክቶች | ☐ | |
| 17 | `common.myAssigned.title.maintenance` | Maintenance Tickets Assigned to Me | የእኔ የተመደቡ የጥገና ትክክቶች | ☐ | |

### `common.notifications` (56)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.notifications.allMarkedRead` | All notifications marked as read | ሁሉም ማስጠንቀቂያዎች እንደተነበበ ተሰምረዋል | ☐ | |
| 2 | `common.notifications.assignedDepartment` | Assigned Department | የተመደበው ክፍል | ☐ | |
| 3 | `common.notifications.backToList` | Back to Notifications | ወደ ማስጠንቀቂያዎች ተመለስ | ☐ | |
| 4 | `common.notifications.dateSubmitted` | Date Submitted | የቀሰበት ቀን | ☐ | |
| 5 | `common.notifications.downloadFailed` | Unable to download attachment | ማጣቪያውን ለመውረስ አልተቻለም | ☐ | |
| 6 | `common.notifications.empty.subtitle` | You will be notified of important updates here | አስፈላጊ ዝማሪዎች እዚህ ይታያሉ | ☐ | |
| 7 | `common.notifications.empty.title` | No notifications | ማስጠንቀቂያዎች የለም | ☐ | |
| 8 | `common.notifications.entityUnavailable` | The request or suggestion this referred to is no longer available to you. | ይህ የተጠቀሰው ጥያቄ ወይም ጥቁስ ከእርስዎ ጋር አልተገኘም። | ☐ | |
| 9 | `common.notifications.equipment` | Equipment: {name} | መሣሪያ: {name} | ☐ | |
| 10 | `common.notifications.error.loadFailed` | Failed to load this notification | ይህን ማስጠንቀቂያ መጫን አልተቻለም | ☐ | |
| 11 | `common.notifications.error.notFound` | This notification is not available | ይህ ማስጠንቀቂያ አይገኝም | ☐ | |
| 12 | `common.notifications.expectedBenefit` | Expected Benefit | የሚጠበቅ ጥቅም | ☐ | |
| 13 | `common.notifications.footer.lead` | Open a notification to read the full request, reply and follow its history.  | ሙሉ ጥያቄውን ለመንቀብ፣ ለመልስ ለመስጠትና ታሪኩን ለመከታተል አንድ ማስጠንቀቂያ ይክፈቱ  | ☐ | |
| 14 | `common.notifications.footer.link` | Track all of your requests | ሁሉንም ጥያቄዎችዎን ይከታተሉ | ☐ | |
| 15 | `common.notifications.footer.tail` | . | ። | ☐ | |
| 16 | `common.notifications.fullHistory` | Full History | ሙሉ ታሪክ | ☐ | |
| 17 | `common.notifications.generalNotification` | This is a general notification with no request attached. | ይህ አጠቃላይ ማስጠንቀቂያ ሲሆን የተያያዘ ጥያቄ የለም። | ☐ | |
| 18 | `common.notifications.insufficientPermissions` | Insufficient permissions | በቂ ፈቃድ የለም | ☐ | |
| 19 | `common.notifications.markAllRead` | Mark all as read | ሁሉንም እንደተነበበ አስምር | ☐ | |
| 20 | `common.notifications.markAllReadFailed` | Failed to update | ማሻሻል አልተቻለም | ☐ | |
| 21 | `common.notifications.markRead` | Mark read | ተነብቷል አድርግ | ☐ | |
| 22 | `common.notifications.markReadLabel` | Mark "{title}" as read | "{title}" እንደተነበበ አስምር | ☐ | |
| 23 | `common.notifications.noDescription` | No description provided. | መግለጫ አልተሰጠም። | ☐ | |
| 24 | `common.notifications.noReplies` | No replies yet — start the conversation. | እስካሁን መልስ የለም — ውይይትን ይጀምሩ። | ☐ | |
| 25 | `common.notifications.notAssigned` | Not assigned | አልተመደበም | ☐ | |
| 26 | `common.notifications.openSuggestion` | Open full suggestion | ሙሉ ጥቁሱን ክፈት | ☐ | |
| 27 | `common.notifications.openTicket` | Open full ticket | ሙሉ ትክክቱን ክፈት | ☐ | |
| 28 | `common.notifications.pref.requests` | Request updates | የጥያቄ ዝማሪዎች | ☐ | |
| 29 | `common.notifications.pref.requestsHint` | Assignments, status changes and replies on IT / maintenance requests | በአይቲ / የጥገና ጥያቄዎች ላይ መደበት፣ የሁኔታ ለውጥና መልስ | ☐ | |
| 30 | `common.notifications.pref.suggestions` | Suggestion updates | የጥቁስ ዝማሪዎች | ☐ | |
| 31 | `common.notifications.pref.suggestionsHint` | Progress and comments on suggestions | የጥቁሶች ሂደትና አስተያየቶች | ☐ | |
| 32 | `common.notifications.pref.system` | System messages | የሲስተም መልእክቶች | ☐ | |
| 33 | `common.notifications.pref.systemHint` | General announcements | አጠቃላይ ማስታወቂያዎች | ☐ | |
| 34 | `common.notifications.priorityBadge` | {priority} Priority | {priority} ቅድምነት | ☐ | |
| 35 | `common.notifications.problemOpportunity` | Problem / Opportunity | ችግር / እድል | ☐ | |
| 36 | `common.notifications.proposedImprovement` | Proposed Improvement | የተጠበቀ ማሻሻያ | ☐ | |
| 37 | `common.notifications.replyFailed` | Failed to send reply | መልሱን መላክ አልተቻለም | ☐ | |
| 38 | `common.notifications.replyPlaceholder` | Write a reply to this request... | ለዚህ ጥያቄ መልስ ይጻፉ... | ☐ | |
| 39 | `common.notifications.replySent` | Reply sent | መልሱ ተልኳል | ☐ | |
| 40 | `common.notifications.replyTitle` | Reply | መልስ | ☐ | |
| 41 | `common.notifications.resolvedOn` | Resolved on {date} | በ{date} ተፈቷል | ☐ | |
| 42 | `common.notifications.responsibleStaff` | Responsible Staff | አስተጠባሪ አስጋር | ☐ | |
| 43 | `common.notifications.settings` | Settings | ቅንብሮች | ☐ | |
| 44 | `common.notifications.settingsDialogLabel` | Notification settings | የማስጠንቀቂያ ቅንብሮች | ☐ | |
| 45 | `common.notifications.settingsSaveFailed` | Failed to save notification settings | የማስጠንቀቂያ ቅንብሮችን መቀመጥ አልተቻለም | ☐ | |
| 46 | `common.notifications.settingsSaved` | Notification settings saved | የማስጠንቀቂያ ቅንብሮች ተቀምጠዋል | ☐ | |
| 47 | `common.notifications.settingsSubtitle` | Choose which notification categories appear for you. | የትክክት ማስጠንቀቂያ ዘርፎች ይምረጡ። | ☐ | |
| 48 | `common.notifications.settingsTitle` | Notification Settings | የማስጠንቀቂያ ቅንብሮች | ☐ | |
| 49 | `common.notifications.stat.requests` | Requests | ጥያቄዎች | ☐ | |
| 50 | `common.notifications.stat.suggestions` | Suggestions | ጥቁሶች | ☐ | |
| 51 | `common.notifications.stat.unread` | Unread | ያልተነበበ | ☐ | |
| 52 | `common.notifications.stat.week` | This Week | የዚህ ሳምንት | ☐ | |
| 53 | `common.notifications.submitted` | Submitted | የቀሰበት | ☐ | |
| 54 | `common.notifications.submittedBy` | Submitted By | ያስገባው | ☐ | |
| 55 | `common.notifications.title` | Notifications | ማስጠንቀቂያዎች | ☐ | |
| 56 | `common.notifications.unreadCount` | {count} unread | {count} ያልተነበበ | ☐ | |

### `common.pagination` (5)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.pagination.label` | Pagination | ገጽ ማስተናገያ | ☐ | |
| 2 | `common.pagination.next` | Next page | ቀጣይ ገጽ | ☐ | |
| 3 | `common.pagination.page` | Page {page} | ገጽ {page} | ☐ | |
| 4 | `common.pagination.previous` | Previous page | ያለፈው ገጽ | ☐ | |
| 5 | `common.pagination.showing` | Showing {from}–{to} of {total} | {from}–{to} ከ {total} ውስጥ በመታወት | ☐ | |

### `common.profile` (27)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.profile.accountStatus` | Account Status | የመለያ ሁኔታ | ☐ | |
| 2 | `common.profile.changePassword` | Change Password | የይለፍ ቃል ቀይር | ☐ | |
| 3 | `common.profile.confirmPassword` | Confirm New Password | አዲስ የይለፍ ቃል አረጋግጥ | ☐ | |
| 4 | `common.profile.currentPassword` | Current Password | የአሁኑ የይለፍ ቃል | ☐ | |
| 5 | `common.profile.employeeId` | Employee ID | የሰራተኛ መለያ ቁጥር | ☐ | |
| 6 | `common.profile.error.currentPasswordRequired` | Please enter your current password | እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ | ☐ | |
| 7 | `common.profile.error.nameRequired` | Name cannot be empty | ስሙ ባዶ መሆን አይችልም | ☐ | |
| 8 | `common.profile.error.passwordMismatch` | Passwords do not match | የይለፍ ቃሎቹ አይስማማም | ☐ | |
| 9 | `common.profile.error.passwordTooShort` | New password must be at least 8 characters | አዲሱ የይለፍ ቃል ቢያንስ 8 ፊደል ማይከል አለበት | ☐ | |
| 10 | `common.profile.failedAttempts` | Failed attempts (30d) | ያልተሳከቱ ሙከራዎች (30 ቀን) | ☐ | |
| 11 | `common.profile.fullName` | Full Name | ሙሉ ስም | ☐ | |
| 12 | `common.profile.lastSignIn` | Last sign-in | የመጨረሻ ግባት | ☐ | |
| 13 | `common.profile.lastSignInAddress` | Last sign-in address: | የመጨረሻ ግባት አድራስ: | ☐ | |
| 14 | `common.profile.newPassword` | New Password | አዲስ የይለፍ ቃል | ☐ | |
| 15 | `common.profile.passwordUpdateFailed` | Failed to update password | የይለፍ ቃሉን መሻሻል አልተቻለም | ☐ | |
| 16 | `common.profile.passwordUpdated` | Password updated successfully | የይለፍ ቃሉ በተሳክነት ተዘምኗል | ☐ | |
| 17 | `common.profile.saveChanges` | Save Changes | ለውጥ አስቀምጥ | ☐ | |
| 18 | `common.profile.saving` | Saving... | በመቀመጥ ላይ… | ☐ | |
| 19 | `common.profile.stat.open` | Open Requests | ክፍት ጥያቄዎች | ☐ | |
| 20 | `common.profile.stat.requests` | My Requests | የእኔ ጥያቄዎች | ☐ | |
| 21 | `common.profile.stat.suggestions` | My Suggestions | የእኔ ጥቁሶች | ☐ | |
| 22 | `common.profile.subtitle` | View your account, update your details and change your password | መለያዎን ይመልከቱ፣ ዝርዝሮችዎን ያሻሽሉና የይለፍ ቃልዎን ይቀይሩ | ☐ | |
| 23 | `common.profile.title` | My Profile | የእኔ መገለጫ | ☐ | |
| 24 | `common.profile.updateFailed` | Failed to update profile | መገለጫውን መሻሻል አልተቻለም | ☐ | |
| 25 | `common.profile.updatePassword` | Update Password | የይለፍ ቃል አሻሽል | ☐ | |
| 26 | `common.profile.updated` | Profile updated | መገለጫዎ ተዘምኗል | ☐ | |
| 27 | `common.profile.updating` | Updating... | በመሻሻል ላይ… | ☐ | |

### `common.statusPipeline` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.statusPipeline` | Status pipeline | የሁኔታ አሰሳሪ | ☐ | |

### `common.ticket` (3)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.ticket.type.it` | IT | አይቲ | ☐ | |
| 2 | `common.ticket.type.maintenance` | Maintenance | ጥገና | ☐ | |
| 3 | `common.ticket.type.suggestion` | Suggestion | ጥቁስ | ☐ | |

### `common.tickets` (3)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.tickets.empty` | No tickets found | ትክክቶች አልተገኙም | ☐ | |
| 2 | `common.tickets.select` | Select ticket {number} | ትክክት {number} ምረጥ | ☐ | |
| 3 | `common.tickets.selectAll` | Select all tickets on this page | በዚህ ገጽ ላይ ያሉትን ትክክቶች ምረጥ | ☐ | |

### `common.timeline` (21)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `common.timeline.assigned` | assigned the request | ጥያቄውን መደበው | ☐ | |
| 2 | `common.timeline.assignedDepartmentChanged` | changed the assigned department | የተመደበውን ክፍል ቀይረው | ☐ | |
| 3 | `common.timeline.assignedPersonChanged` | changed the responsible staff member | ተጠባሪውን አስገባሪ አድርጎ ቀይረው | ☐ | |
| 4 | `common.timeline.attachmentAdded` | attached a file | ፋይል አያያይ | ☐ | |
| 5 | `common.timeline.attachmentRemoved` | removed a file | ፋይል አስወግደው | ☐ | |
| 6 | `common.timeline.closed` | closed the request | ጥያቄውን ዘግቷው | ☐ | |
| 7 | `common.timeline.commentAdded` | added a comment | አስተያየት ጨምረው | ☐ | |
| 8 | `common.timeline.completed` | completed the work | ሥራውን አጠናቀቁ | ☐ | |
| 9 | `common.timeline.created` | created the request | ጥያቄውን ፈጠረው | ☐ | |
| 10 | `common.timeline.empty` | Nothing has happened yet | እስካሁን ምንም አልተከለለም | ☐ | |
| 11 | `common.timeline.entries` | {count} entries | {count} ግምገማዎች | ☐ | |
| 12 | `common.timeline.informationProvided` | provided the requested information | የተጠየቀውን መረጃ የሰጡ | ☐ | |
| 13 | `common.timeline.none` | none | ምንም | ☐ | |
| 14 | `common.timeline.priorityChanged` | changed the priority | ቅድምነቱን ቀይረው | ☐ | |
| 15 | `common.timeline.rejected` | rejected the suggestion | ጥቁሱን ውድቅ አድረጉ | ☐ | |
| 16 | `common.timeline.reopened` | reopened the request | ጥያቄውን እንደገና ከፈቱ | ☐ | |
| 17 | `common.timeline.resolved` | resolved the request | ጥያቄውን ፈታው | ☐ | |
| 18 | `common.timeline.statusChanged` | changed the status | ሁኔታውን ቀይረው | ☐ | |
| 19 | `common.timeline.system` | System | ሲስተም | ☐ | |
| 20 | `common.timeline.unknown` | updated the request ({action}) | ጥያቄውን ዘምነው ({action}) | ☐ | |
| 21 | `common.timeline.workNotesAdded` | added work notes | የሥራ ማስታወሻ ጨምረው | ☐ | |


## it — IT dashboard, ticket list and ticket detail

### `it.dashboard` (17)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `it.dashboard.allTickets` | All IT Tickets | ሁሉም የአይቲ ትክክቶች | ☐ | |
| 2 | `it.dashboard.byCategory` | IT Tickets by Category | የአይቲ ትክክቶች በዘርፍ | ☐ | |
| 3 | `it.dashboard.byStatus` | IT tickets by status | የአይቲ ትክክቶች በሁኔታ | ☐ | |
| 4 | `it.dashboard.error.loadFailed` | Failed to load dashboard | ዳሽቦርዱን መጫን አልተቻለም | ☐ | |
| 5 | `it.dashboard.list.assigned.title` | My Assigned IT Tickets | የተመደቡኝኝ የአይቲ ትክክቶች | ☐ | |
| 6 | `it.dashboard.list.overdue.empty` | No overdue IT tickets | የጊዜ ገደብ ያልፏት የአይቲ ትክክት የለም | ☐ | |
| 7 | `it.dashboard.list.overdue.title` | Overdue IT Tickets | የጊዜ ገደብ ያልፏት የአይቲ ትክክቶች | ☐ | |
| 8 | `it.dashboard.list.recent.empty` | No IT tickets in period | በዚህ ጊዜ ክፍል የአይቲ ትክክት የለም | ☐ | |
| 9 | `it.dashboard.list.recent.title` | Recent IT Tickets | የቅርብ የአይቲ ትክክቶች | ☐ | |
| 10 | `it.dashboard.list.unresolved.empty` | No unresolved IT tickets. Great job! | ያልተፈታ የአይቲ ትክክት የለም። ጥሩ ሥራ! | ☐ | |
| 11 | `it.dashboard.list.unresolved.title` | Unresolved IT Tickets | ያልተፈታ የአይቲ ትክክቶች | ☐ | |
| 12 | `it.dashboard.stat.open` | Open (active) | ክፍት (ንቁ) | ☐ | |
| 13 | `it.dashboard.stat.overdue` | Overdue | የጊዜ ገደብ አልፏት | ☐ | |
| 14 | `it.dashboard.stat.total` | Total IT Tickets | ጠቅላላ የአይቲ ትክክቶች | ☐ | |
| 15 | `it.dashboard.subtitle.staff` | Manage your assigned tickets | የተመደቡትን ትክክቶች ያስተዳድሩ | ☐ | |
| 16 | `it.dashboard.subtitle.supervisor` | Monitor the IT queue and unresolved tickets | የአይቲ ሰልጠናና ታልቋ ያልተፈታ ትክክቶችን ይከታተሉ | ☐ | |
| 17 | `it.dashboard.title` | IT Support Dashboard | የአይቲ ድጋፍ ዳሽቦርድ | ☐ | |

### `it.detail` (56)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `it.detail.action.closeTicket` | Close Ticket | ትክክቱን ዝጋ | ☐ | |
| 2 | `it.detail.action.markResolved` | Mark Resolved | ተፈቷል አድርግ | ☐ | |
| 3 | `it.detail.action.notSolved` | Not Solved | አልተፈቷም | ☐ | |
| 4 | `it.detail.action.problemSolved` | Problem Solved | ችግሩ ተፈቷል | ☐ | |
| 5 | `it.detail.aria.actions` | Ticket actions | የትክክት እርምጃዎች | ☐ | |
| 6 | `it.detail.aria.assignTechnician` | Assign to technician | ወደ ቴክኒሽያን ይመደቡ | ☐ | |
| 7 | `it.detail.aria.changePriority` | Change priority | ቅድምነቱን ቀይር | ☐ | |
| 8 | `it.detail.aria.updateStatus` | Update status | ሁኔታውን አሻሽል | ☐ | |
| 9 | `it.detail.aria.workNotes` | Work notes | የሥራ ማስታወሻዎች | ☐ | |
| 10 | `it.detail.assign.priority` | Priority: | ቅድምነት: | ☐ | |
| 11 | `it.detail.assign.technician` | Assign to Technician: | ወደ ቴክኒሽያን ይመደቡ: | ☐ | |
| 12 | `it.detail.attach.label` | Attach file (screenshot, document) | ፋይል ያያይዙ (ክራስክሪን፣ ሰነድ) | ☐ | |
| 13 | `it.detail.back.toItTickets` | Back to IT Tickets | ወደ የአይቲ ትክክቶች ተመለስ | ☐ | |
| 14 | `it.detail.back.toMyRequests` | Back to My Requests | ወደ የእኔ ጥያቄዎች ተመለስ | ☐ | |
| 15 | `it.detail.error.describeInfo` | Please describe the additional information | እባክዎ ተጨማሪ መረጃውን ይግለጹ | ☐ | |
| 16 | `it.detail.error.loadFailed` | Failed to load this ticket | ይህን ትክክት መጫን አልተቻለም | ☐ | |
| 17 | `it.detail.error.notFound` | Ticket not found | ትክክቱ አልተገኘም | ☐ | |
| 18 | `it.detail.error.resolutionRequired` | A resolution description is required when resolving a ticket | ትክክቱን ሲፈታ የመፍትሔ መግለጫ መስገብ ያስፈልጋል | ☐ | |
| 19 | `it.detail.header.closedOn` | Closed {date} | በ{date} ተዘግቷል | ☐ | |
| 20 | `it.detail.history.title` | Ticket History | የትክክት ታሪክ | ☐ | |
| 21 | `it.detail.info.hint` | The IT team needs more details. Please provide them below so work can continue. | የአይቲ ቡድኑ ተጨማሪ ዝርዝር ያስፈልጋል። ሥራው እንዲቀጥል እባክዎ ከታች ያትሙ። | ☐ | |
| 22 | `it.detail.info.placeholder` | Additional details... | ተጨማሪ ዝርዝሮች... | ☐ | |
| 23 | `it.detail.info.submit` | Submit Information | መረጃ አስገባ | ☐ | |
| 24 | `it.detail.info.title` | Additional Information Requested | ተጨማሪ መረጃ ተጠይቷል | ☐ | |
| 25 | `it.detail.resolution.confirm` | Confirm Resolution | መፍትሔውን አረጋግጥ | ☐ | |
| 26 | `it.detail.resolution.label` | Resolution Description | የመፍትሔ መግለጫ | ☐ | |
| 27 | `it.detail.resolution.placeholder` | Describe what was done to solve the problem... | ችግሩን ለመፍታት ምን ተደረጋል ይግለጹ... | ☐ | |
| 28 | `it.detail.resolution.recommended` | (recommended) | (የተመክረው) | ☐ | |
| 29 | `it.detail.status.apply` | Apply | ተግብር | ☐ | |
| 30 | `it.detail.status.applyStatus` | Apply Status | ሁኔታውን ተግብር | ☐ | |
| 31 | `it.detail.status.current` | Current status: | የአሁኑ ሁኔታ: | ☐ | |
| 32 | `it.detail.status.currentSuffix` | (current) | (አሁኑ) | ☐ | |
| 33 | `it.detail.status.setTo` | Set status to: | ሁኔታ ይሁኑ: | ☐ | |
| 34 | `it.detail.tab.workNotes` | Work Notes | የሥራ ማስታወሻዎች | ☐ | |
| 35 | `it.detail.toast.assigned` | Ticket assigned | ትክክቱ ተመደቧል | ☐ | |
| 36 | `it.detail.toast.commentAdded` | Comment added | አስተያየት ተጨምሯል | ☐ | |
| 37 | `it.detail.toast.commentFailed` | Failed to add comment | አስተያየት መጨመር አልተቻለም | ☐ | |
| 38 | `it.detail.toast.filesUploaded` | Files uploaded | ፋይሎች ተጫነዋል | ☐ | |
| 39 | `it.detail.toast.infoFailed` | Failed to submit information | መረጃ ማስገባት አልተቻለም | ☐ | |
| 40 | `it.detail.toast.infoProvided` | Information provided - ticket updated | መረጃ ተሰጥቷል - ትክክቱ ተዘምኗል | ☐ | |
| 41 | `it.detail.toast.markedResolved` | Ticket marked as resolved | ትክክቱ ተፈቷል ብሎ ተመዝግቧል | ☐ | |
| 42 | `it.detail.toast.priorityUpdated` | Priority updated | ቅድምነቱ ተዘምኗል | ☐ | |
| 43 | `it.detail.toast.problemNotSolved` | Ticket reopened - problem not solved | ትክክቱ እንደገና ተከፍቷል - ችግሩ አልተፈቷም | ☐ | |
| 44 | `it.detail.toast.problemSolved` | Confirmed - problem solved | ተረጋግጧል - ችግሩ ተፈቷል | ☐ | |
| 45 | `it.detail.toast.statusUpdated` | Status updated | ሁኔታው ተዘምኗል | ☐ | |
| 46 | `it.detail.toast.ticketClosed` | Ticket closed | ትክክቱ ተዘግቷል | ☐ | |
| 47 | `it.detail.toast.updateFailed` | Update failed | ማሻሻል አልተቻለም | ☐ | |
| 48 | `it.detail.toast.updated` | Ticket updated | ትክክቱ ተዘምኗል | ☐ | |
| 49 | `it.detail.toast.uploadFailed` | Upload failed | ጫን አልተቻለም | ☐ | |
| 50 | `it.detail.toast.workNoteFailed` | Failed to add work note | የሥራ ማስታወሻ መጨመር አልተቻለም | ☐ | |
| 51 | `it.detail.toast.workNoteRecorded` | Work note recorded | የሥራ ማስታወሻ ተመዝግቧል | ☐ | |
| 52 | `it.detail.work.addNote` | Add Note | ማስታወሻ ጨምር | ☐ | |
| 53 | `it.detail.work.partsPlaceholder` | Parts/materials used (optional) | የተጠቀሙ ክፍሎች/መሣሪያዎች (አማራጭ) | ☐ | |
| 54 | `it.detail.work.partsUsed` | Parts used: | የተጠቀሙ ክፍሎች: | ☐ | |
| 55 | `it.detail.work.placeholder` | Record what you did to solve the problem... | ችግሩን ለመፍታት ምን አደረግክ ይመዝግቡ... | ☐ | |
| 56 | `it.detail.work.title` | Work Notes | የሥራ ማስታወሻዎች | ☐ | |

### `it.tickets` (16)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `it.tickets.aria.filterCategory` | Filter by category | በዘርፍ ያጣሩ | ☐ | |
| 2 | `it.tickets.aria.filterDepartment` | Filter by department | በክፍል ያጣሩ | ☐ | |
| 3 | `it.tickets.aria.search` | Search tickets | ትክክቶች ይፈልጉ | ☐ | |
| 4 | `it.tickets.bulk.assignSelected` | Assign selected | የተመረጡትን ይመደቡ | ☐ | |
| 5 | `it.tickets.bulk.selected` | {count} ticket(s) selected | {count} ትክክቶች ተመርጠዋል | ☐ | |
| 6 | `it.tickets.count` | {count} ticket(s) | {count} ትክክቶች | ☐ | |
| 7 | `it.tickets.empty.subtitle` | New tickets will appear here | አዲስ ትክክቶች እዚህ ይታያሉ | ☐ | |
| 8 | `it.tickets.empty.title` | No IT tickets found | የአይቲ ትክክቶች አልተገኙም | ☐ | |
| 9 | `it.tickets.error.loadFailed` | Failed to load IT tickets | የአይቲ ትክክቶችን መጫን አልተቻለም | ☐ | |
| 10 | `it.tickets.filter.allCategories` | All Categories | ሁሉም ዘርፎች | ☐ | |
| 11 | `it.tickets.filter.allDepartments` | All Departments | ሁሉም ክፍሎች | ☐ | |
| 12 | `it.tickets.filter.searchPlaceholder` | Search ticket #, title, requester... | በትክክት ቁጥር፣ በርዕስ ወይም በጠያቂ ይፈልጉ... | ☐ | |
| 13 | `it.tickets.subtitle` | View and manage IT support tickets | የአይቲ ድጋፍ ትክክቶችን ይመልከቱና ያስተዳድሩ | ☐ | |
| 14 | `it.tickets.title` | IT Tickets | የአይቲ ትክክቶች | ☐ | |
| 15 | `it.tickets.toast.bulkAssignFailed` | {failed} of {total} tickets could not be assigned | ከ{total} ትክክቶች {failed} መደበት አልተቻለም | ☐ | |
| 16 | `it.tickets.toast.bulkAssignSuccess` | Assigned {count} ticket(s) | {count} ትክክቶች ተመደቧል | ☐ | |


## maintenance — Maintenance dashboard, ticket list and ticket detail

### `maintenance.dashboard` (17)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `maintenance.dashboard.allTickets` | All Maintenance Tickets | ሁሉም የጥገና ትክክቶች | ☐ | |
| 2 | `maintenance.dashboard.byCategory` | Maintenance Requests by Category | የጥገና ትክክቶች በዘርፍ | ☐ | |
| 3 | `maintenance.dashboard.byStatus` | Maintenance requests by status | የጥገና ጥያቄዎች በሁኔታ | ☐ | |
| 4 | `maintenance.dashboard.error.loadFailed` | Failed to load dashboard | ዳሽቦርዱን መጫን አልተቻለም | ☐ | |
| 5 | `maintenance.dashboard.list.assigned.title` | My Assigned Maintenance Requests | የተመደቡኝኝ የጥገና ጥያቄዎች | ☐ | |
| 6 | `maintenance.dashboard.list.overdue.empty` | No overdue maintenance requests | የጊዜ ገደብ ያልፏት የጥገና ጥያቄ የለም | ☐ | |
| 7 | `maintenance.dashboard.list.overdue.title` | Overdue Maintenance Requests | የጊዜ ገደብ ያልፏት የጥገና ጥያቄዎች | ☐ | |
| 8 | `maintenance.dashboard.list.recent.empty` | No maintenance requests in period | በዚህ ጊዜ ክፍል የጥገና ጥያቄ የለም | ☐ | |
| 9 | `maintenance.dashboard.list.recent.title` | Recent Maintenance Requests | የቅርብ የጥገና ጥያቄዎች | ☐ | |
| 10 | `maintenance.dashboard.list.unresolved.empty` | No unresolved maintenance requests. Great job! | ያልተፈታ የጥገና ጥያቄ የለም። ጥሩ ሥራ! | ☐ | |
| 11 | `maintenance.dashboard.list.unresolved.title` | Unresolved Maintenance Requests | ያልተፈታ የጥገና ጥያቄዎች | ☐ | |
| 12 | `maintenance.dashboard.stat.open` | Open (active) | ክፍት (ንቁ) | ☐ | |
| 13 | `maintenance.dashboard.stat.overdue` | Overdue | የጊዜ ገደብ አልፏት | ☐ | |
| 14 | `maintenance.dashboard.stat.total` | Total Maintenance | ጠቅላላ የጥገና ትክክቶች | ☐ | |
| 15 | `maintenance.dashboard.subtitle.staff` | Manage your assigned requests | የተመደቡትን ጥያቄዎች ያስተዳድሩ | ☐ | |
| 16 | `maintenance.dashboard.subtitle.supervisor` | Monitor the maintenance queue and unresolved requests | የጥገና ሰልጠናና ታልቋ ያልተፈታ ጥያቄዎችን ይከታተሉ | ☐ | |
| 17 | `maintenance.dashboard.title` | Maintenance Dashboard | የጥገና ዳሽቦርድ | ☐ | |

### `maintenance.detail` (51)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `maintenance.detail.action.closeRequest` | Close Request | ጥያቄውን ዝጋ | ☐ | |
| 2 | `maintenance.detail.action.markCompleted` | Mark Completed | ተጠናቋል አድርግ | ☐ | |
| 3 | `maintenance.detail.action.notFixed` | Not Fixed | አልተፈቷም | ☐ | |
| 4 | `maintenance.detail.action.problemFixed` | Problem Fixed | ችግሩ ተፈቷል | ☐ | |
| 5 | `maintenance.detail.aria.actions` | Ticket actions | የትክክት እርምጃዎች | ☐ | |
| 6 | `maintenance.detail.aria.assignTechnician` | Assign to technician | ወደ ቴክኒሽያን ይመደቡ | ☐ | |
| 7 | `maintenance.detail.aria.changePriority` | Change priority | ቅድምነቱን ቀይር | ☐ | |
| 8 | `maintenance.detail.aria.updateStatus` | Update status | ሁኔታውን አሻሽል | ☐ | |
| 9 | `maintenance.detail.aria.workNotes` | Work notes | የሥራ ማስታወሻዎች | ☐ | |
| 10 | `maintenance.detail.assign.priority` | Priority: | ቅድምነት: | ☐ | |
| 11 | `maintenance.detail.assign.technician` | Assign to Technician: | ወደ ቴክኒሽያን ይመደቡ: | ☐ | |
| 12 | `maintenance.detail.attach.label` | Attach photo (before/after) | ፎቶ ያያይዙ (ከሥራ በፊት / በኋላ) | ☐ | |
| 13 | `maintenance.detail.back.toMyRequests` | Back to My Requests | ወደ የእኔ ጥያቄዎች ተመለስ | ☐ | |
| 14 | `maintenance.detail.back.toTickets` | Back to Maintenance Tickets | ወደ የጥገና ትክክቶች ተመለስ | ☐ | |
| 15 | `maintenance.detail.completion.confirm` | Confirm Completion | መጠናቀቂያውን አረጋግጥ | ☐ | |
| 16 | `maintenance.detail.completion.label` | Completion Description | የመጠናቀቂያ መግለጫ | ☐ | |
| 17 | `maintenance.detail.completion.placeholder` | Describe the problem found, action taken, and materials used... | የተገኘውን ችግር፣ የተደረጉትን እርምጃ እና የተጠቀሙትን መሣሪያዎች ይግለጹ... | ☐ | |
| 18 | `maintenance.detail.completion.recommended` | (recommended) | (የተመክረው) | ☐ | |
| 19 | `maintenance.detail.error.completionRequired` | A completion description is required when marking work completed | ሥራውን ሲጠክቅ የመጠናቀቂያ መግለጫ መስገብ ያስፈልጋል | ☐ | |
| 20 | `maintenance.detail.error.loadFailed` | Failed to load this ticket | ይህን ትክክት መጫን አልተቻለም | ☐ | |
| 21 | `maintenance.detail.error.notFound` | Ticket not found | ትክክቱ አልተገኘም | ☐ | |
| 22 | `maintenance.detail.header.closedOn` | Closed {date} | በ{date} ተዘግቷል | ☐ | |
| 23 | `maintenance.detail.header.completedOn` | Completed on {date} | በ{date} ተጠናቋል | ☐ | |
| 24 | `maintenance.detail.history.title` | Request History | የጥያቄ ታሪክ | ☐ | |
| 25 | `maintenance.detail.records.partsUsed` | Materials / parts: | የተጠቀሙ ክፍሎች / መሣሪያዎች: | ☐ | |
| 26 | `maintenance.detail.records.title` | Maintenance Records | የጥገና መዝገቦች | ☐ | |
| 27 | `maintenance.detail.status.apply` | Apply | ተግብር | ☐ | |
| 28 | `maintenance.detail.status.applyStatus` | Apply Status | ሁኔታውን ተግብር | ☐ | |
| 29 | `maintenance.detail.status.current` | Current status: | የአሁኑ ሁኔታ: | ☐ | |
| 30 | `maintenance.detail.status.currentSuffix` | (current) | (አሁኑ) | ☐ | |
| 31 | `maintenance.detail.status.setTo` | Set status to: | ሁኔታ ይሁኑ: | ☐ | |
| 32 | `maintenance.detail.summary.title` | Completion Summary | የመጠናቀቂያ ማጠቃለያ | ☐ | |
| 33 | `maintenance.detail.tab.recordWork` | Record Work | የሥራ ማስታወሻ ጨምር | ☐ | |
| 34 | `maintenance.detail.toast.assigned` | Request assigned | ጥያቄው ተመደቧል | ☐ | |
| 35 | `maintenance.detail.toast.commentAdded` | Comment added | አስተያየት ተጨምሯል | ☐ | |
| 36 | `maintenance.detail.toast.commentFailed` | Failed to add comment | አስተያየት መጨመር አልተቻለም | ☐ | |
| 37 | `maintenance.detail.toast.filesUploaded` | Files uploaded | ፋይሎች ተጫነዋል | ☐ | |
| 38 | `maintenance.detail.toast.markedCompleted` | Ticket marked as completed | ትክክቱ ተጠናቋል ብሎ ተመዝግቧል | ☐ | |
| 39 | `maintenance.detail.toast.priorityUpdated` | Priority updated | ቅድምነቱ ተዘምኗል | ☐ | |
| 40 | `maintenance.detail.toast.problemFixed` | Confirmed - problem fixed | ተረጋግጧል - ችግሩ ተፈቷል | ☐ | |
| 41 | `maintenance.detail.toast.problemNotFixed` | Request reopened - problem not fixed | ጥያቄው እንደገና ተከፍቷል - ችግሩ አልተፈቷም | ☐ | |
| 42 | `maintenance.detail.toast.requestClosed` | Request closed | ጥያቄው ተዘግቷል | ☐ | |
| 43 | `maintenance.detail.toast.statusUpdated` | Status updated | ሁኔታው ተዘምኗል | ☐ | |
| 44 | `maintenance.detail.toast.updateFailed` | Update failed | ማዻሻያው አልተቻለም | ☐ | |
| 45 | `maintenance.detail.toast.updated` | Ticket updated | ትክክቱ ተዘምኗል | ☐ | |
| 46 | `maintenance.detail.toast.uploadFailed` | Upload failed | ጫን አልተቻለም | ☐ | |
| 47 | `maintenance.detail.toast.workNoteFailed` | Failed to add work note | የሥራ ማስታወሻ መጨመር አልተቻለም | ☐ | |
| 48 | `maintenance.detail.toast.workRecorded` | Work recorded | የሥራ መዝገብ ተመዝግቧል | ☐ | |
| 49 | `maintenance.detail.work.partsPlaceholder` | Materials / parts used (optional) | የተጠቀሙ ክፍሎች / መሣሪያዎች (አማራጭ) | ☐ | |
| 50 | `maintenance.detail.work.placeholder` | Record problem found and action taken... | የተገኘውን ችግርና የተደረገውን እርምጃ ይመዝግቡ... | ☐ | |
| 51 | `maintenance.detail.work.saveRecord` | Save Record | መዝገቡን አስቀምጥ | ☐ | |

### `maintenance.tickets` (20)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `maintenance.tickets.aria.filterCategory` | Filter by category | በዘርፍ ያጣሩ | ☐ | |
| 2 | `maintenance.tickets.aria.filterDate` | Filter by date | በቀን ያጣሩ | ☐ | |
| 3 | `maintenance.tickets.aria.filterDepartment` | Filter by department | በክፍል ያጣሩ | ☐ | |
| 4 | `maintenance.tickets.aria.filterLocation` | Filter by location | በቦታ ያጣሩ | ☐ | |
| 5 | `maintenance.tickets.aria.filterTechnician` | Filter by assigned technician | በተመደበው ቴክኒሽያን ያጣሩ | ☐ | |
| 6 | `maintenance.tickets.aria.search` | Search tickets | ትክክቶች ይፈልጉ | ☐ | |
| 7 | `maintenance.tickets.bulk.assignSelected` | Assign selected | የተመረጡትን ይመደቡ | ☐ | |
| 8 | `maintenance.tickets.bulk.selected` | {count} ticket(s) selected | {count} ትክክቶች ተመርጠዋል | ☐ | |
| 9 | `maintenance.tickets.count` | {count} ticket(s) | {count} ትክክቶች | ☐ | |
| 10 | `maintenance.tickets.empty.subtitle` | New requests will appear here | አዲስ ጥያቄዎች እዚህ ይታያሉ | ☐ | |
| 11 | `maintenance.tickets.empty.title` | No maintenance tickets found | የጥገና ትክክቶች አልተገኙም | ☐ | |
| 12 | `maintenance.tickets.error.loadFailed` | Failed to load maintenance tickets | የጥገና ትክክቶችን መጫን አልተቻለም | ☐ | |
| 13 | `maintenance.tickets.filter.allCategories` | All Categories | ሁሉም ዘርፎች | ☐ | |
| 14 | `maintenance.tickets.filter.allDepartments` | All Departments | ሁሉም ክፍሎች | ☐ | |
| 15 | `maintenance.tickets.filter.allTechnicians` | All Technicians | ሁሉም ቴክኒሽያኖች | ☐ | |
| 16 | `maintenance.tickets.filter.locationPlaceholder` | Location... | ቦታ... | ☐ | |
| 17 | `maintenance.tickets.subtitle` | View and manage maintenance requests | የጥገና ጥያቄዎችን ይመልከቱና ያስተዳድሩ | ☐ | |
| 18 | `maintenance.tickets.title` | Maintenance Tickets | የጥገና ትክክቶች | ☐ | |
| 19 | `maintenance.tickets.toast.bulkAssignFailed` | {failed} of {total} tickets could not be assigned | ከ{total} ትክክቶች {failed} መደበት አልተቻለም | ☐ | |
| 20 | `maintenance.tickets.toast.bulkAssignSuccess` | Assigned {count} ticket(s) | {count} ትክክቶች ተመደቧል | ☐ | |


## multimedia — Digital signage module

### `multimedia.action` (7)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.action.broadcast` | Broadcast | ማሰራጨት | ☐ | |
| 2 | `multimedia.action.heartbeatOffline` | Device went offline | መሳሪያው ከመስመር ውጪ ሆነ | ☐ | |
| 3 | `multimedia.action.heartbeatOnline` | Device came online | መሳሪያው ወደ መስመር ላይ መጣ | ☐ | |
| 4 | `multimedia.action.play` | Play | አጫውት | ☐ | |
| 5 | `multimedia.action.scheduleStart` | Scheduled broadcast | የተያዘ ስርጭት | ☐ | |
| 6 | `multimedia.action.scheduleStop` | Scheduled stop | የተያዘ ማቆሚያ | ☐ | |
| 7 | `multimedia.action.stop` | Stop | አቁም | ☐ | |

### `multimedia.broadcast` (28)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.broadcast.broadcast` | Broadcast | ማሰራጨት | ☐ | |
| 2 | `multimedia.broadcast.howItWorks.line1After` | command and are marked as playing. Devices without a fresh heartbeat within the timeout (default 3 minutes) are recorded as offline and excluded — never fabricated as successful. | የሚል ትዕዛዝ ይቀበላሉ እና በማጫወት ላይ እንደሆኑ ተመዝግበዋል። በጊዜ ገደቡ ውስጥ (ነባሪ 3 ደቂቃ) አዲስ ልብ ምት የሌላቸው መሳሪያዎች እንደ ከመስመር ውጪ ተመዝግበው ይወገዳሉ — በተሳካ ሁኔታ እንደተጫወተ በሐሰት አይዘገቡም። | ☐ | |
| 3 | `multimedia.broadcast.howItWorks.line1Before` | Online devices receive a | በመስመር ላይ ያሉ መሳሪያዎች | ☐ | |
| 4 | `multimedia.broadcast.howItWorks.line2` | Real hardware integration, emergency broadcast and remote power are later-phase features; the current mock player reports play/stop only. | እውነተኛ የሃርድዌር ውህደት፣ የአደጋ ጊዜ ማሰራጨት እና የርቀት ማጥፋት/ማብራት በኋላ ደረጃ ባህሪዎች ናቸው፤ የአሁኑ የሙከራ ማጫወቻ መጫወት/ማቆም ብቻ ነው የሚዘግበው። | ☐ | |
| 5 | `multimedia.broadcast.howItWorks.title` | How broadcasting works | ማሰራጨት እንዴት እንደሚሰራ | ☐ | |
| 6 | `multimedia.broadcast.media.label` | Media Asset | የሚዲያ ንብረት | ☐ | |
| 7 | `multimedia.broadcast.media.select` | — select media — | — ሚዲያ ይምረጡ — | ☐ | |
| 8 | `multimedia.broadcast.priority.high` | High | ከፍተኛ | ☐ | |
| 9 | `multimedia.broadcast.priority.label` | Priority | ቅድምነት | ☐ | |
| 10 | `multimedia.broadcast.priority.normal` | Normal | መደበኛ | ☐ | |
| 11 | `multimedia.broadcast.result.devices` | Devices | መሳሪያዎች | ☐ | |
| 12 | `multimedia.broadcast.result.offline` | Offline | ከመስመር ውጪ | ☐ | |
| 13 | `multimedia.broadcast.result.playing` | Playing | በማጫወት ላይ | ☐ | |
| 14 | `multimedia.broadcast.result.title` | Broadcast Result | የማሰራጨት ውጤት | ☐ | |
| 15 | `multimedia.broadcast.subtitle` | Send a media asset to one device, a group, or every display at once | የሚዲያ ንብረትን ወደ አንድ መሳሪያ፣ ቡድን ወይም ሁሉንም ማሳያዎች በአንዴ ይላኩ | ☐ | |
| 16 | `multimedia.broadcast.target.all` | All devices | ሁሉም መሳሪያዎች | ☐ | |
| 17 | `multimedia.broadcast.target.allInfo` | Every active device in the hospital. Offline or errored devices are recorded as offline and are never reported as playing. | በሆስፒታሉ ውስጥ ያሉ ሁሉም ንቁ መሳሪያዎች። ከመስመር ውጪ ወይም ችግር ያለባቸው መሳሪያዎች እንደ ከመስመር ውጪ ተመዝግበው ተሳክቶ እንደተጫወተ አይዘገቡም። | ☐ | |
| 18 | `multimedia.broadcast.target.device` | Single device | ነጠላ መሳሪያ | ☐ | |
| 19 | `multimedia.broadcast.target.deviceLabel` | Device | መሳሪያ | ☐ | |
| 20 | `multimedia.broadcast.target.group` | A group | ቡድን | ☐ | |
| 21 | `multimedia.broadcast.target.groupLabel` | Group | ቡድን | ☐ | |
| 22 | `multimedia.broadcast.target.label` | Target | ኢላማ | ☐ | |
| 23 | `multimedia.broadcast.target.select` | — select — | — ይምረጡ — | ☐ | |
| 24 | `multimedia.broadcast.title` | Broadcast Content | ይዘት ማሰራጨት | ☐ | |
| 25 | `multimedia.broadcast.toast.completed` | Broadcast completed | ማሰራጨት ተጠናቋል | ☐ | |
| 26 | `multimedia.broadcast.toast.failed` | Broadcast failed | ማሰራጨት አልተሳካም | ☐ | |
| 27 | `multimedia.broadcast.toast.selectMedia` | Select a media asset to broadcast | የሚዲያ ንብረት ይምረጡ | ☐ | |
| 28 | `multimedia.broadcast.toast.selectTarget` | Select a target | ኢላማ ይምረጡ | ☐ | |

### `multimedia.commands` (17)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.commands.empty` | No pending or failed commands | በመጠባበቅ ወይም ያልተሳኩ ትዕዛዞች የሉም | ☐ | |
| 2 | `multimedia.commands.notice` | This page requires a supervisor role. Devices poll for pending commands during heartbeat; a failed delivery can be redelivered from this view. | ይህ ገጽ የተቆጣጠሪ ሚና ይፈልጋል። መሳሪያዎች በልብ ምት ወቅት በመጠባበቅ ላይ ያሉ ትዕዛዞችን ይመረምራሉ፤ ያልተሳካ ማድረስ ከዚህ ገጽ እንደገና ሊላክ ይችላል። | ☐ | |
| 3 | `multimedia.commands.redeliver` | Redeliver | እንደገና ላክ | ☐ | |
| 4 | `multimedia.commands.redeliver.onlyFailed` | Only failed commands can be redelivered | ያልተሳኩ ትዕዛዞች ብቻ እንደገና ሊላኩ ይችላሉ | ☐ | |
| 5 | `multimedia.commands.redeliver.title` | Redeliver this command | ይህን ትዕዛዝ እንደገና ላክ | ☐ | |
| 6 | `multimedia.commands.subtitle` | Pending and failed commands awaiting delivery to displays | ወደ ማሳያዎች ለመድረስ በመጠባበቅ ወይም ያልተሳኩ ትዕዛዞች | ☐ | |
| 7 | `multimedia.commands.table.actions` | Actions | እርምጃዎች | ☐ | |
| 8 | `multimedia.commands.table.attempts` | Attempts | ሙከራዎች | ☐ | |
| 9 | `multimedia.commands.table.command` | Command | ትዕዛዝ | ☐ | |
| 10 | `multimedia.commands.table.device` | Device | መሳሪያ | ☐ | |
| 11 | `multimedia.commands.table.error` | Error | ስህተት | ☐ | |
| 12 | `multimedia.commands.table.requestedAt` | Requested At | የተጠየቀበት ጊዜ | ☐ | |
| 13 | `multimedia.commands.table.requestedBy` | Requested By | የጠየቀው | ☐ | |
| 14 | `multimedia.commands.table.status` | Status | ሁኔታ | ☐ | |
| 15 | `multimedia.commands.title` | Device Commands | የመሳሪያ ትዕዛዞች | ☐ | |
| 16 | `multimedia.commands.toast.redelivered` | Command redelivered | ትዕዛዝ እንደገና ተልኳል | ☐ | |
| 17 | `multimedia.commands.toast.redeliveryFailed` | Redelivery failed | እንደገና መላክ አልተሳካም | ☐ | |

### `multimedia.dashboard` (20)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.dashboard.error.loadFailed` | Could not load multimedia dashboard | የሚልቲሚዲያ ዳሽቦርድ መጫን አልተቻለም | ☐ | |
| 2 | `multimedia.dashboard.needsAttention.empty` | All displays healthy | ሁሉም ማሳያዎች ጤናማ ናቸው | ☐ | |
| 3 | `multimedia.dashboard.needsAttention.title` | Needs Attention | ትኩረት ያስፈልጋል | ☐ | |
| 4 | `multimedia.dashboard.playerIntegration.mockDescription` | Development mock player — reports play and stop only; no hardware is controlled. | የልማት ሙከራ ማጫወቻ — መጫወት እና ማቆም ብቻ ይዘግባል፤ ምንም ሃርድዌር አይቆጣጠርም። | ☐ | |
| 5 | `multimedia.dashboard.playerIntegration.notSupported` | Not supported in this phase | በዚህ ደረጃ አይደገፍም | ☐ | |
| 6 | `multimedia.dashboard.playerIntegration.supportedCommands` | Supported commands | የተደገፉ ትዕዛዞች | ☐ | |
| 7 | `multimedia.dashboard.playerIntegration.title` | Player Integration | የማጫወቻ ውህደት | ☐ | |
| 8 | `multimedia.dashboard.recentActivity.by` | by {name} | በ {name} | ☐ | |
| 9 | `multimedia.dashboard.recentActivity.empty` | No activity yet | እስካሁን እንቅስቃሴ የለም | ☐ | |
| 10 | `multimedia.dashboard.recentActivity.title` | Recent Playback Activity | የቅርብ ጊዜ መጫወቻ እንቅስቃሴ | ☐ | |
| 11 | `multimedia.dashboard.refresh` | Refresh | አድስ | ☐ | |
| 12 | `multimedia.dashboard.stat.activeSchedules` | Active Schedules | ንቁ መርሃዎች | ☐ | |
| 13 | `multimedia.dashboard.stat.mediaAssets` | Media Assets | የሚዲያ ንብረቶች | ☐ | |
| 14 | `multimedia.dashboard.stat.nowPlaying` | {count} now playing | {count} በማጫወት ላይ | ☐ | |
| 15 | `multimedia.dashboard.stat.offline` | Offline | ከመስመር ውጪ | ☐ | |
| 16 | `multimedia.dashboard.stat.online` | Online | በመስመር ላይ | ☐ | |
| 17 | `multimedia.dashboard.stat.todayActivity` | Today's Activity | የዛሬ እንቅስቃሴ | ☐ | |
| 18 | `multimedia.dashboard.stat.totalDevices` | Total Devices | ጠቅላላ መሳሪያዎች | ☐ | |
| 19 | `multimedia.dashboard.subtitle` | Monitor and control display devices across the hospital | በሆስፒታሉ ውስጥ ያሉ የማሳያ መሳሪያዎችን ይቆጣጠሩ እና ይከታተሉ | ☐ | |
| 20 | `multimedia.dashboard.title` | Digital Signage Overview | ዲጂታል ሳይኔስ አጠቃላይ እይታ | ☐ | |

### `multimedia.deviceDetail` (28)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.deviceDetail.back` | ← All devices | ← ሁሉም መሳሪያዎች | ☐ | |
| 2 | `multimedia.deviceDetail.capability.title` | Capability manifest | የችሎታ መግለጫ | ☐ | |
| 3 | `multimedia.deviceDetail.commandHistory.command` | Command | ትዕዛዝ | ☐ | |
| 4 | `multimedia.deviceDetail.commandHistory.details` | Details | ዝርዝር | ☐ | |
| 5 | `multimedia.deviceDetail.commandHistory.empty` | No commands sent to this device yet | ለዚህ መሳሪያ እስካሁን ትዕዛዝ አልተላከም | ☐ | |
| 6 | `multimedia.deviceDetail.commandHistory.requestedAt` | Requested At | የተጠየቀበት ጊዜ | ☐ | |
| 7 | `multimedia.deviceDetail.commandHistory.requestedBy` | Requested By | የጠየቀው | ☐ | |
| 8 | `multimedia.deviceDetail.commandHistory.status` | Status | ሁኔታ | ☐ | |
| 9 | `multimedia.deviceDetail.commandHistory.title` | Command History | የትዕዛዝ ታሪክ | ☐ | |
| 10 | `multimedia.deviceDetail.disabledNotice` | This device is disabled and will not receive broadcasts. | ይህ መሳሪያ ተሰናክሏል እና ማሰራጨት አይቀበልም። | ☐ | |
| 11 | `multimedia.deviceDetail.groupMembership.empty` | Not a member of any group. | የማንኛውም ቡድን አባል አይደለም። | ☐ | |
| 12 | `multimedia.deviceDetail.groupMembership.title` | Group Membership | የቡድን አባልነት | ☐ | |
| 13 | `multimedia.deviceDetail.lastHeartbeat` | Last heartbeat: | የመጨረሻ ልብ ምት: | ☐ | |
| 14 | `multimedia.deviceDetail.noLocation` | No location | ቦታ የለም | ☐ | |
| 15 | `multimedia.deviceDetail.notFound` | Device not found | መሳሪያ አልተገኘም | ☐ | |
| 16 | `multimedia.deviceDetail.nowPlaying` | Now playing: | አሁን በማጫወት ላይ: | ☐ | |
| 17 | `multimedia.deviceDetail.refresh` | Refresh | አድስ | ☐ | |
| 18 | `multimedia.deviceDetail.sendCommand.offline` | Device is offline — commands will not be delivered. | መሳሪያው ከመስመር ውጪ ነው — ትዕዛዞች አይደርሱም። | ☐ | |
| 19 | `multimedia.deviceDetail.sendCommand.permissions` | Your role can view this device. Register, edit and command permissions require a supervisor. | ሚናዎ ይህን መሳሪያ ማየት ብቻ ይችላል። መመዝገብ፣ ማረም እና ትዕዛዝ መላክ የተቆጣጠሪ ፈቃድ ይፈልጋል። | ☐ | |
| 20 | `multimedia.deviceDetail.sendCommand.play` | Play | አጫውት | ☐ | |
| 21 | `multimedia.deviceDetail.sendCommand.stop` | Stop | አቁም | ☐ | |
| 22 | `multimedia.deviceDetail.sendCommand.subtitle` | The mock player integration supports play and stop only. Other commands are reported as unsupported — never faked as success. | የሙከራ ማጫወቻ ውህደት መጫወት እና ማቆም ብቻ ነው የሚደግፈው። ሌሎች ትዕዛዞች እንደማይደገፉ ይዘገባሉ — በተሳካ ሁኔታ አይገመቱም። | ☐ | |
| 23 | `multimedia.deviceDetail.sendCommand.title` | Send Command | ትዕዛዝ ላክ | ☐ | |
| 24 | `multimedia.deviceDetail.sendCommand.unsupported` | Unsupported (mock integration) | ያልተደገፈ (የሙከራ ውህደት) | ☐ | |
| 25 | `multimedia.deviceDetail.sendCommand.unsupportedTitle` | {cmd} is not supported in this phase | {cmd} በዚህ ደረጃ አይደገፍም | ☐ | |
| 26 | `multimedia.deviceDetail.toast.acknowledged` | Command acknowledged | ትዕዛዝ ተቀብሏል | ☐ | |
| 27 | `multimedia.deviceDetail.toast.failed` | Command failed | ትዕዛዝ አልተሳካም | ☐ | |
| 28 | `multimedia.deviceDetail.unknown` | Unknown | ያልታወቀ | ☐ | |

### `multimedia.devices` (45)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.devices.action.disable` | Disable device | መሳሪያ አሰናክል | ☐ | |
| 2 | `multimedia.devices.action.enable` | Enable device | መሳሪያ አንቃ | ☐ | |
| 3 | `multimedia.devices.action.viewDetails` | View details | ዝርዝር አሳይ | ☐ | |
| 4 | `multimedia.devices.apply` | Apply | ተግብር | ☐ | |
| 5 | `multimedia.devices.empty` | No devices match your filters | ከማጣሪያዎ ጋር የሚስማማ መሳሪያ የለም | ☐ | |
| 6 | `multimedia.devices.filter.allStatuses` | All statuses | ሁሉም ሁኔታዎች | ☐ | |
| 7 | `multimedia.devices.modal.form.connection` | Connection | ግንኙነት | ☐ | |
| 8 | `multimedia.devices.modal.form.connection.ethernet` | Ethernet | Ethernet | ☐ | |
| 9 | `multimedia.devices.modal.form.connection.wifi` | Wi-Fi | Wi-Fi | ☐ | |
| 10 | `multimedia.devices.modal.form.floor` | Floor | ፎቅ | ☐ | |
| 11 | `multimedia.devices.modal.form.ipAddress` | IP Address | IP አድራሻ | ☐ | |
| 12 | `multimedia.devices.modal.form.ipPlaceholder` | 10.20.1.x | 10.20.1.x | ☐ | |
| 13 | `multimedia.devices.modal.form.location` | Location | ቦታ | ☐ | |
| 14 | `multimedia.devices.modal.form.location.none` | — none — | — ምንም — | ☐ | |
| 15 | `multimedia.devices.modal.form.manufacturer` | Manufacturer | አምራች | ☐ | |
| 16 | `multimedia.devices.modal.form.model` | Model | ሞዴል | ☐ | |
| 17 | `multimedia.devices.modal.form.name` | Device Name | የመሳሪያ ስም | ☐ | |
| 18 | `multimedia.devices.modal.form.room` | Room | ክፍል | ☐ | |
| 19 | `multimedia.devices.modal.form.submit` | Register | መዝግብ | ☐ | |
| 20 | `multimedia.devices.modal.form.type` | Type | አይነት | ☐ | |
| 21 | `multimedia.devices.modal.form.type.display` | Display | ማሳያ | ☐ | |
| 22 | `multimedia.devices.modal.form.type.mediaPlayer` | Media Player | የሚዲያ ማጫወቻ | ☐ | |
| 23 | `multimedia.devices.modal.form.type.tv` | TV | ቴሌቪዥን | ☐ | |
| 24 | `multimedia.devices.modal.register.title` | Register Display Device | የማሳያ መሳሪያ መዝግብ | ☐ | |
| 25 | `multimedia.devices.modal.secret.after` | . | ። | ☐ | |
| 26 | `multimedia.devices.modal.secret.bodyBefore` | The device will use it in the heartbeat header | መሳሪያው በልብ ምት ራስጌ ውስጥ የሚከተለውን ይጠቀማል | ☐ | |
| 27 | `multimedia.devices.modal.secret.done` | Done | ተጠናቋል | ☐ | |
| 28 | `multimedia.devices.modal.secret.title` | This secret is shown once — store it now | ይህ ምስጢር አንዴ ብቻ ይታያል — አሁን ያስቀምጡ | ☐ | |
| 29 | `multimedia.devices.register` | Register Device | መሳሪያ መዝግብ | ☐ | |
| 30 | `multimedia.devices.search.placeholder` | Search name, identifier, room... | ስም፣ መለያ፣ ክፍል ይፈልጉ... | ☐ | |
| 31 | `multimedia.devices.subtitle` | Registered TVs and media players across the hospital | በሆስፒታሉ ውስጥ የተመዘገቡ ቴሌቪዥኖች እና የሚዲያ ማጫወቻዎች | ☐ | |
| 32 | `multimedia.devices.table.actions` | Actions | እርምጃዎች | ☐ | |
| 33 | `multimedia.devices.table.device` | Device | መሳሪያ | ☐ | |
| 34 | `multimedia.devices.table.identifier` | Identifier | መለያ | ☐ | |
| 35 | `multimedia.devices.table.ipAddress` | IP Address | IP አድራሻ | ☐ | |
| 36 | `multimedia.devices.table.lastHeartbeat` | Last Heartbeat | የመጨረሻ ልብ ምት | ☐ | |
| 37 | `multimedia.devices.table.location` | Location | ቦታ | ☐ | |
| 38 | `multimedia.devices.table.status` | Status | ሁኔታ | ☐ | |
| 39 | `multimedia.devices.title` | Display Devices | የማሳያ መሳሪያዎች | ☐ | |
| 40 | `multimedia.devices.toast.disabled` | Device disabled | መሳሪያ ተሰናክሏል | ☐ | |
| 41 | `multimedia.devices.toast.enabled` | Device enabled | መሳሪያ ነቅቷል | ☐ | |
| 42 | `multimedia.devices.toast.nameRequired` | Name is required | ስም ያስፈልጋል | ☐ | |
| 43 | `multimedia.devices.toast.operationFailed` | Operation failed | ክዋኔ አልተሳካም | ☐ | |
| 44 | `multimedia.devices.toast.registered` | Device registered | መሳሪያ ተመዝግቧል | ☐ | |
| 45 | `multimedia.devices.toast.registrationFailed` | Registration failed | መመዝገብ አልተሳካም | ☐ | |

### `multimedia.groups` (20)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.groups.action.delete` | Delete group | ቡድን ሰርዝ | ☐ | |
| 2 | `multimedia.groups.action.edit` | Edit group | ቡድን አርትዕ | ☐ | |
| 3 | `multimedia.groups.create` | Create Group | ቡድን ፍጠር | ☐ | |
| 4 | `multimedia.groups.deleteConfirm` | Delete group "{name}"? Device membership is removed but devices are kept. | ቡድን "{name}" ይሰረዝ? የመሳሪያ አባልነት ይወገዳል ነገር ግን መሳሪያዎች ይቀራሉ። | ☐ | |
| 5 | `multimedia.groups.devicesCount` | {count} devices | {count} መሳሪያዎች | ☐ | |
| 6 | `multimedia.groups.empty` | No groups yet | እስካሁን ቡድን የለም | ☐ | |
| 7 | `multimedia.groups.form.description` | Description | መግለጫ | ☐ | |
| 8 | `multimedia.groups.form.devices` | Devices ({count} selected) | መሳሪያዎች ({count} ተመርጠዋል) | ☐ | |
| 9 | `multimedia.groups.form.name` | Group Name | የቡድን ስም | ☐ | |
| 10 | `multimedia.groups.form.noActive` | No active devices to add. | ለመጨመር ንቁ መሳሪያ የለም። | ☐ | |
| 11 | `multimedia.groups.modal.create` | Create Group | ቡድን ፍጠር | ☐ | |
| 12 | `multimedia.groups.modal.edit` | Edit Group | ቡድን አርትዕ | ☐ | |
| 13 | `multimedia.groups.subtitle` | Organize devices (e.g. waiting areas) for one-shot broadcasts | መሳሪያዎችን ያደራጁ (ለምሳሌ የመጠባበቂያ ክፍሎች) ለአንዴ ማሰራጨት | ☐ | |
| 14 | `multimedia.groups.title` | Display Groups | የማሳያ ቡድኖች | ☐ | |
| 15 | `multimedia.groups.toast.created` | Group created | ቡድን ተፈጥሯል | ☐ | |
| 16 | `multimedia.groups.toast.deleteFailed` | Delete failed | መሰረዝ አልተሳካም | ☐ | |
| 17 | `multimedia.groups.toast.deleted` | Group deleted | ቡድን ተሰርዟል | ☐ | |
| 18 | `multimedia.groups.toast.nameRequired` | Group name is required | የቡድን ስም ያስፈልጋል | ☐ | |
| 19 | `multimedia.groups.toast.saveFailed` | Save failed | ማስቀመጥ አልተሳካም | ☐ | |
| 20 | `multimedia.groups.toast.updated` | Group updated | ቡድን ተዘምኗል | ☐ | |

### `multimedia.history` (23)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.history.apply` | Apply | ተግብር | ☐ | |
| 2 | `multimedia.history.clear` | Clear | አጽዳ | ☐ | |
| 3 | `multimedia.history.detail.deviceId` | Device ID | የመሳሪያ መለያ | ☐ | |
| 4 | `multimedia.history.detail.error` | Error | ስህተት | ☐ | |
| 5 | `multimedia.history.detail.group` | Group | ቡድን | ☐ | |
| 6 | `multimedia.history.detail.mediaId` | Media ID | የሚዲያ መለያ | ☐ | |
| 7 | `multimedia.history.empty` | No history records | የታሪክ መዝገቦች የሉም | ☐ | |
| 8 | `multimedia.history.filter.allDevices` | All devices | ሁሉም መሳሪያዎች | ☐ | |
| 9 | `multimedia.history.filter.allMedia` | All media | ሁሉም ሚዲያ | ☐ | |
| 10 | `multimedia.history.filter.allResults` | All results | ሁሉም ውጤቶች | ☐ | |
| 11 | `multimedia.history.filter.device` | Device | መሳሪያ | ☐ | |
| 12 | `multimedia.history.filter.media` | Media | ሚዲያ | ☐ | |
| 13 | `multimedia.history.filter.result` | Result | ውጤት | ☐ | |
| 14 | `multimedia.history.filters` | Filters | ማጣሪያዎች | ☐ | |
| 15 | `multimedia.history.pagination` | Page {page} of {totalPages} · {total} records | ገጽ {page} ከ {totalPages} · {total} መዝገቦች | ☐ | |
| 16 | `multimedia.history.subtitle` | Audit trail of every broadcast and schedule run | የእያንዳንዱ ማሰራጨት እና የመርሃ ግብር ማስኬጃ ኦዲት መንገድ | ☐ | |
| 17 | `multimedia.history.table.action` | Action | እርምጃ | ☐ | |
| 18 | `multimedia.history.table.device` | Device | መሳሪያ | ☐ | |
| 19 | `multimedia.history.table.media` | Media | ሚዲያ | ☐ | |
| 20 | `multimedia.history.table.result` | Result | ውጤት | ☐ | |
| 21 | `multimedia.history.table.triggeredBy` | Triggered By | ያስነሳው | ☐ | |
| 22 | `multimedia.history.table.when` | When | መቼ | ☐ | |
| 23 | `multimedia.history.title` | Playback History | የመጫወቻ ታሪክ | ☐ | |

### `multimedia.locations` (30)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.locations.action.addChild` | Add child location | የልጅ ቦታ አክል | ☐ | |
| 2 | `multimedia.locations.action.delete` | Delete location | ቦታ ሰርዝ | ☐ | |
| 3 | `multimedia.locations.action.edit` | Edit location | ቦታ አርትዕ | ☐ | |
| 4 | `multimedia.locations.add` | Add Location | ቦታ አክል | ☐ | |
| 5 | `multimedia.locations.childCount` | {count} child | {count} ልጅ | ☐ | |
| 6 | `multimedia.locations.deleteConfirm` | Delete "{name}"? Devices attached to it will be unassigned. | "{name}" ይሰረዝ? በእሱ ላይ የተገናኙ መሳሪያዎች ያልተመደቡ ይሆናሉ። | ☐ | |
| 7 | `multimedia.locations.devicesCount` | {count} devices | {count} መሳሪያዎች | ☐ | |
| 8 | `multimedia.locations.empty` | No locations defined | ቦታዎች አልተገለጹም | ☐ | |
| 9 | `multimedia.locations.form.level` | Level | ደረጃ | ☐ | |
| 10 | `multimedia.locations.form.name` | Name | ስም | ☐ | |
| 11 | `multimedia.locations.form.namePlaceholder` | e.g. Outpatient Waiting Area | ለምሳሌ የመጠባበቂያ ክፍል | ☐ | |
| 12 | `multimedia.locations.form.notes` | Notes | ማስታወሻዎች | ☐ | |
| 13 | `multimedia.locations.form.parent` | Parent | ወላጅ | ☐ | |
| 14 | `multimedia.locations.form.parent.none` | — none (root) — | — ምንም (ሥር) — | ☐ | |
| 15 | `multimedia.locations.level.building` | Building | ሕንፃ | ☐ | |
| 16 | `multimedia.locations.level.campus` | Campus | ግቢ | ☐ | |
| 17 | `multimedia.locations.level.floor` | Floor | ፎቅ | ☐ | |
| 18 | `multimedia.locations.level.location` | Location | ቦታ | ☐ | |
| 19 | `multimedia.locations.level.room` | Room | ክፍል | ☐ | |
| 20 | `multimedia.locations.level.ward` | Ward | ዋርድ | ☐ | |
| 21 | `multimedia.locations.modal.add` | Add Location | ቦታ አክል | ☐ | |
| 22 | `multimedia.locations.modal.edit` | Edit Location | ቦታ አርትዕ | ☐ | |
| 23 | `multimedia.locations.subtitle` | Hierarchy of physical sites where displays are installed | ማሳያዎች የተጫኑባቸው የአካል ቦታዎች ተዋረድ | ☐ | |
| 24 | `multimedia.locations.title` | Locations | ቦታዎች | ☐ | |
| 25 | `multimedia.locations.toast.created` | Location created | ቦታ ተፈጥሯል | ☐ | |
| 26 | `multimedia.locations.toast.deleteFailed` | Delete failed | መሰረዝ አልተሳካም | ☐ | |
| 27 | `multimedia.locations.toast.deleted` | Location deleted | ቦታ ተሰርዟል | ☐ | |
| 28 | `multimedia.locations.toast.nameRequired` | Location name is required | የቦታ ስም ያስፈልጋል | ☐ | |
| 29 | `multimedia.locations.toast.saveFailed` | Save failed | ማስቀመጥ አልተሳካም | ☐ | |
| 30 | `multimedia.locations.toast.updated` | Location updated | ቦታ ተዘምኗል | ☐ | |

### `multimedia.media` (32)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.media.action.activate` | Activate media | ሚዲያ አንቃ | ☐ | |
| 2 | `multimedia.media.action.archive` | Archive media | ሚዲያ በማህደር አስቀምጥ | ☐ | |
| 3 | `multimedia.media.action.preview` | Preview | ቅድመ እይታ | ☐ | |
| 4 | `multimedia.media.apply` | Apply | ተግብር | ☐ | |
| 5 | `multimedia.media.empty` | No media found | ሚዲያ አልተገኘም | ☐ | |
| 6 | `multimedia.media.filter.allStatuses` | All statuses | ሁሉም ሁኔታዎች | ☐ | |
| 7 | `multimedia.media.form.category` | Category | ምድብ | ☐ | |
| 8 | `multimedia.media.form.category.announcement` | Announcement | ማስታወቂያ | ☐ | |
| 9 | `multimedia.media.form.category.awareness` | Awareness | ግንዛቤ | ☐ | |
| 10 | `multimedia.media.form.category.event` | Event | ክስተት | ☐ | |
| 11 | `multimedia.media.form.category.image` | Image | ምስል | ☐ | |
| 12 | `multimedia.media.form.category.other` | Other | ሌላ | ☐ | |
| 13 | `multimedia.media.form.category.safety` | Safety | ደህንነት | ☐ | |
| 14 | `multimedia.media.form.category.video` | Video | ቪዲዮ | ☐ | |
| 15 | `multimedia.media.form.file` | File | ፋይል | ☐ | |
| 16 | `multimedia.media.form.fileHint` | Images (jpg, png, webp) or short videos (mp4, webm) | ምስሎች (jpg, png, webp) ወይም አጭር ቪዲዮዎች (mp4, webm) | ☐ | |
| 17 | `multimedia.media.form.submit` | Upload | ጫን | ☐ | |
| 18 | `multimedia.media.form.title` | Title | ርዕስ | ☐ | |
| 19 | `multimedia.media.modal.upload.title` | Upload Media | ሚዲያ ጫን | ☐ | |
| 20 | `multimedia.media.pagination` | Page {page} of {totalPages} · {total} items | ገጽ {page} ከ {totalPages} · {total} ንጥሎች | ☐ | |
| 21 | `multimedia.media.search.placeholder` | Search title... | ርዕስ ይፈልጉ... | ☐ | |
| 22 | `multimedia.media.subtitle` | Images and short videos available for broadcasts | ለማሰራጨት የሚገኙ ምስሎች እና አጭር ቪዲዮዎች | ☐ | |
| 23 | `multimedia.media.title` | Media Library | የሚዲያ መጻሕፍት ቤት | ☐ | |
| 24 | `multimedia.media.toast.activated` | Media activated | ሚዲያ ነቅቷል | ☐ | |
| 25 | `multimedia.media.toast.archived` | Media archived | ሚዲያ በማህደር ተቀምጧል | ☐ | |
| 26 | `multimedia.media.toast.fileRequired` | Choose a file to upload | የሚጫን ፋይል ይምረጡ | ☐ | |
| 27 | `multimedia.media.toast.operationFailed` | Operation failed | ክዋኔ አልተሳካም | ☐ | |
| 28 | `multimedia.media.toast.titleRequired` | Title is required | ርዕስ ያስፈልጋል | ☐ | |
| 29 | `multimedia.media.toast.uploadFailed` | Upload failed | መጫን አልተሳካም | ☐ | |
| 30 | `multimedia.media.toast.uploaded` | Media uploaded | ሚዲያ ተጭኗል | ☐ | |
| 31 | `multimedia.media.upload` | Upload Media | ሚዲያ ጫን | ☐ | |
| 32 | `multimedia.media.uploadedBy` | Uploaded by {name} | በ {name} ተጭኗል | ☐ | |

### `multimedia.schedules` (56)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.schedules.action.delete` | Delete schedule | መርሃ ሰርዝ | ☐ | |
| 2 | `multimedia.schedules.create` | Create Schedule | መርሃ ፍጠር | ☐ | |
| 3 | `multimedia.schedules.day.0` | Sun | እሑድ | ☐ | |
| 4 | `multimedia.schedules.day.1` | Mon | ሰኞ | ☐ | |
| 5 | `multimedia.schedules.day.2` | Tue | ማክሰኞ | ☐ | |
| 6 | `multimedia.schedules.day.3` | Wed | ረቡዕ | ☐ | |
| 7 | `multimedia.schedules.day.4` | Thu | ሐሙስ | ☐ | |
| 8 | `multimedia.schedules.day.5` | Fri | ዓርብ | ☐ | |
| 9 | `multimedia.schedules.day.6` | Sat | ቅዳሜ | ☐ | |
| 10 | `multimedia.schedules.deleteConfirm` | Delete schedule "{title}"? | መርሃ "{title}" ይሰረዝ። | ☐ | |
| 11 | `multimedia.schedules.empty` | No schedules yet | እስካሁን መርሃ የለም | ☐ | |
| 12 | `multimedia.schedules.form.datetime` | Date & Time | ቀን እና ሰዓት | ☐ | |
| 13 | `multimedia.schedules.form.daysOfWeek` | Days of week | የሳምንት ቀኖች | ☐ | |
| 14 | `multimedia.schedules.form.media` | Media | ሚዲያ | ☐ | |
| 15 | `multimedia.schedules.form.media.select` | — select — | — ይምረጡ — | ☐ | |
| 16 | `multimedia.schedules.form.priority` | Priority | ቅድምነት | ☐ | |
| 17 | `multimedia.schedules.form.priority.high` | High | ከፍተኛ | ☐ | |
| 18 | `multimedia.schedules.form.priority.normal` | Normal | መደበኛ | ☐ | |
| 19 | `multimedia.schedules.form.repeat` | Repeat | ድገም | ☐ | |
| 20 | `multimedia.schedules.form.repeat.daily` | Daily | በየቀኑ | ☐ | |
| 21 | `multimedia.schedules.form.repeat.none` | Does not repeat | አይደገምም | ☐ | |
| 22 | `multimedia.schedules.form.repeat.specific` | Specific days of the week | የተወሰኑ የሳምንት ቀኖች | ☐ | |
| 23 | `multimedia.schedules.form.repeat.weekly` | Weekly (same day of week) | በየሳምንቱ (ተመሳሳይ የሳምንት ቀን) | ☐ | |
| 24 | `multimedia.schedules.form.startDate` | Start Date | የመጀመሪያ ቀን | ☐ | |
| 25 | `multimedia.schedules.form.target` | Target | ኢላማ | ☐ | |
| 26 | `multimedia.schedules.form.target.all` | All devices | ሁሉም መሳሪያዎች | ☐ | |
| 27 | `multimedia.schedules.form.target.device` | Single device | ነጠላ መሳሪያ | ☐ | |
| 28 | `multimedia.schedules.form.target.group` | A group | ቡድን | ☐ | |
| 29 | `multimedia.schedules.form.target.select` | — select — | — ይምረጡ — | ☐ | |
| 30 | `multimedia.schedules.form.time` | Time | ሰዓት | ☐ | |
| 31 | `multimedia.schedules.form.title` | Title | ርዕስ | ☐ | |
| 32 | `multimedia.schedules.form.titlePlaceholder` | e.g. Morning waiting-area announcements | ለምሳሌ የጠዋት መጠባበቂያ ክፍል ማስታወቂያዎች | ☐ | |
| 33 | `multimedia.schedules.modal.create` | Create Schedule | መርሃ ፍጠር | ☐ | |
| 34 | `multimedia.schedules.repeat.daily` | Daily | በየቀኑ | ☐ | |
| 35 | `multimedia.schedules.repeat.none` | Once | አንዴ | ☐ | |
| 36 | `multimedia.schedules.repeat.weekly` | Weekly | በየሳምንቱ | ☐ | |
| 37 | `multimedia.schedules.save` | Save Schedule | መርሃ አስቀምጥ | ☐ | |
| 38 | `multimedia.schedules.subtitle` | Runs are processed when the server is next queried — no background worker in this phase | ማስኬጃዎች ሰርቨሩ በሚጠየቅበት ጊዜ ይሰራሉ — በዚህ ደረጃ የጀርባ ሰራተኛ የለም | ☐ | |
| 39 | `multimedia.schedules.table.actions` | Actions | እርምጃዎች | ☐ | |
| 40 | `multimedia.schedules.table.lastRun` | Last Run | የመጨረሻ ማስኬጃ | ☐ | |
| 41 | `multimedia.schedules.table.media` | Media | ሚዲያ | ☐ | |
| 42 | `multimedia.schedules.table.repeat` | Repeat | ድገም | ☐ | |
| 43 | `multimedia.schedules.table.runs` | Runs | ማስኬጃዎች | ☐ | |
| 44 | `multimedia.schedules.table.status` | Status | ሁኔታ | ☐ | |
| 45 | `multimedia.schedules.table.target` | Target | ኢላማ | ☐ | |
| 46 | `multimedia.schedules.table.title` | Title | ርዕስ | ☐ | |
| 47 | `multimedia.schedules.title` | Playback Schedules | የመጫወቻ መርሃዎች | ☐ | |
| 48 | `multimedia.schedules.toast.created` | Schedule created — due runs will be processed at request time | መርሃ ተፈጥሯል — ተገቢ ማስኬጃዎች በጥያቄ ጊዜ ይሰራሉ | ☐ | |
| 49 | `multimedia.schedules.toast.dateRequired` | Pick a date and time | ቀን እና ሰዓት ይምረጡ | ☐ | |
| 50 | `multimedia.schedules.toast.daysRequired` | Pick at least one day | ቢያንስ አንድ ቀን ይምረጡ | ☐ | |
| 51 | `multimedia.schedules.toast.deleteFailed` | Delete failed | መሰረዝ አልተሳካም | ☐ | |
| 52 | `multimedia.schedules.toast.deleted` | Schedule deleted | መርሃ ተሰርዟል | ☐ | |
| 53 | `multimedia.schedules.toast.mediaRequired` | Select a media asset | የሚዲያ ንብረት ይምረጡ | ☐ | |
| 54 | `multimedia.schedules.toast.saveFailed` | Save failed | ማስቀመጥ አልተሳካም | ☐ | |
| 55 | `multimedia.schedules.toast.targetRequired` | Select a target | ኢላማ ይምረጡ | ☐ | |
| 56 | `multimedia.schedules.toast.titleRequired` | Schedule title is required | የመርሃ ርዕስ ያስፈልጋል | ☐ | |

### `multimedia.settings` (15)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.settings.field.allowItStaff` | Let IT staff send device commands | የአይቲ ሠራተኞች የመሳሪያ ትዕዛዞችን እንዲልኩ ፍቀድ | ☐ | |
| 2 | `multimedia.settings.field.deviceLimit` | Max devices that can be registered | ሊመዘገቡ የሚችሉ ከፍተኛ መሳሪያዎች ቁጥር | ☐ | |
| 3 | `multimedia.settings.field.heartbeatTimeout` | Heartbeat timeout (minutes) | የልብ ምት ጊዜ ገደብ (ደቂቃ) | ☐ | |
| 4 | `multimedia.settings.help.allowItStaff` | When off, only IT supervisors, administrators and system administrators can send device commands. | ሲጠፋ፣ የአይቲ ተቆጣጠሪዎች፣ አስተዳዳሪዎች እና የሲስተም አስተዳዳሪዎች ብቻ የመሳሪያ ትዕዛዞችን መላክ ይችላሉ። | ☐ | |
| 5 | `multimedia.settings.help.deviceLimit` | Hard cap for the register endpoint. 0 disables the limit. | ለመመዝገብ ገጽ ጠንካራ ገደብ። 0 ገደቡን ያሰናክላል። | ☐ | |
| 6 | `multimedia.settings.help.heartbeatTimeout` | A device without a fresh heartbeat within this window is treated as offline. | በዚህ መስኮት ውስጥ አዲስ ልብ ምት የሌለው መሳሪያ እንደ ከመስመር ውጪ ተደርጎ ይቆጠራል። | ☐ | |
| 7 | `multimedia.settings.noticeAfter` | table — device registration, broadcasts, schedule changes, command delivery and irrecoverable media deletion — keeping the Digital Signage system compliant with hospital audit policies. | ሰንጠረዥ ይጻፋሉ — የመሳሪያ መመዝገብ፣ ማሰራጨት፣ የመርሃ ለውጥ፣ የትዕዛዝ ማድረስ እና የማይመለሱ የሚዲያ ማጥፋት — የዲጂታል ሳይኔስ ስርዓት ከሆስፒታል ኦዲት መመሪያዎች ጋር እንዲጣጣም ያደርገዋል። | ☐ | |
| 8 | `multimedia.settings.noticeBefore` | Every action through the API is written to the | በ API በኩል የሚከናወኑ ሁሉም እርምጃዎች በ | ☐ | |
| 9 | `multimedia.settings.off` | Off | ጠፍቷል | ☐ | |
| 10 | `multimedia.settings.on` | On | በርቷል | ☐ | |
| 11 | `multimedia.settings.save` | Save Settings | ቅንብሮች አስቀምጥ | ☐ | |
| 12 | `multimedia.settings.subtitle` | Module configuration and regulatory audit trail | የሞጁል ውቅር እና የቁጥጥር ኦዲት መንገድ | ☐ | |
| 13 | `multimedia.settings.title` | Settings & Audit | ቅንብሮች እና ኦዲት | ☐ | |
| 14 | `multimedia.settings.toast.failed` | Save failed | ማስቀመጥ አልተሳካም | ☐ | |
| 15 | `multimedia.settings.toast.saved` | Settings saved | ቅንብሮች ተቀምጠዋል | ☐ | |

### `multimedia.status` (2)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.status.error` | Error | ስህተት | ☐ | |
| 2 | `multimedia.status.success` | Success | ተሳክቷል | ☐ | |

### `multimedia.system` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `multimedia.system` | System | ሲስተም | ☐ | |


## nav — Sidebar navigation labels and groups

### `nav.allRequests` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.allRequests` | All Requests | ሁሉም ጥያቄዎች | ☐ | |

### `nav.auditLogs` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.auditLogs` | Audit Logs | የኦዲት መዝገቦች | ☐ | |

### `nav.broadcast` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.broadcast` | Broadcast | የብሮድካስት ስርጭት | ☐ | |

### `nav.categories` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.categories` | Categories | ዘርፎች | ☐ | |

### `nav.commands` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.commands` | Commands | ትዕዛዦች | ☐ | |

### `nav.dashboard` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.dashboard` | Dashboard | ዳሽቦርድ | ☐ | |

### `nav.departments` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.departments` | Departments | ክፍሎች | ☐ | |

### `nav.devices` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.devices` | Devices | መሣሪያዎች | ☐ | |

### `nav.group` (9)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.group.administration` | Administration | አስተዳደር | ☐ | |
| 2 | `nav.group.general` | General | አጠቃላይ | ☐ | |
| 3 | `nav.group.myArea` | My Area | የእኔ ክፍል | ☐ | |
| 4 | `nav.group.operations` | Operations | ክዋኔዎች | ☐ | |
| 5 | `nav.group.quality` | Quality | ጥራት | ☐ | |
| 6 | `nav.group.reporting` | Reporting | መዝገብ | ☐ | |
| 7 | `nav.group.requests` | Requests | ጥያቄዎች | ☐ | |
| 8 | `nav.group.signage` | Digital Signage | ዲጂታል ሳይኔስ | ☐ | |
| 9 | `nav.group.tickets` | Tickets | ትክክቶች | ☐ | |

### `nav.groups` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.groups` | Groups | ቡድኖች | ☐ | |

### `nav.history` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.history` | History | ታሪክ | ☐ | |

### `nav.itTickets` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.itTickets` | IT Tickets | የአይቲ ትክክቶች | ☐ | |

### `nav.locations` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.locations` | Locations | ቦታዎች | ☐ | |

### `nav.maintenanceTickets` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.maintenanceTickets` | Maintenance Tickets | የጥገና ትክክቶች | ☐ | |

### `nav.mediaLibrary` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.mediaLibrary` | Media Library | የሚዲያ መጽሐፍት ቤት | ☐ | |

### `nav.multimediaHome` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.multimediaHome` | Multimedia Home | የሚልቲሚዲያ መነሻ | ☐ | |

### `nav.myAssignedTickets` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.myAssignedTickets` | My Assigned Tickets | የተመደበኝኝ ትክክቶች | ☐ | |

### `nav.myRequests` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.myRequests` | My Requests | የእኔ ጥያቄዎች | ☐ | |

### `nav.mySuggestions` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.mySuggestions` | My Suggestions | የእኔ ጥቁሶች | ☐ | |

### `nav.newItRequest` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.newItRequest` | New IT Request | አዲስ የአይቲ ጥያቄ | ☐ | |

### `nav.newMaintenanceRequest` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.newMaintenanceRequest` | New Maintenance Request | አዲስ የጥገና ጥያቄ | ☐ | |

### `nav.newSuggestion` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.newSuggestion` | New Suggestion | አዲስ ጥቁስ | ☐ | |

### `nav.notifications` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.notifications` | Notifications | ማስጠንቀቂያዎች | ☐ | |

### `nav.reports` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.reports` | Reports | መዝገቦች | ☐ | |

### `nav.schedules` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.schedules` | Schedules | መርሃዎች | ☐ | |

### `nav.settings` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.settings` | Settings | ቅንብሮች | ☐ | |

### `nav.settingsAudit` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.settingsAudit` | Settings & Audit | ቅንብሮች እና ኦዲት | ☐ | |

### `nav.suggestions` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.suggestions` | Suggestions | ጥቁሶች | ☐ | |

### `nav.users` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `nav.users` | Users | ተጠቃሚዎች | ☐ | |


## priority — Priority values (Low, Medium, High, Critical)

### `priority.critical` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `priority.critical` | Critical | አስቸኳይ | ☐ | |

### `priority.high` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `priority.high` | High | ከፍተኛ | ☐ | |

### `priority.low` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `priority.low` | Low | ዝቅተኛ | ☐ | |

### `priority.medium` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `priority.medium` | Medium | መካከለኛ | ☐ | |


## role — User role names

### `role.admin` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.admin` | Administrator | አስተዳደር | ☐ | |

### `role.it_staff` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.it_staff` | IT staff | የአይቲ አስጋር | ☐ | |

### `role.it_supervisor` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.it_supervisor` | IT supervisor | የአይቲ ተቆጣጠሪ | ☐ | |

### `role.maintenance_staff` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.maintenance_staff` | Maintenance staff | የጥገና አስጋር | ☐ | |

### `role.maintenance_supervisor` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.maintenance_supervisor` | Maintenance supervisor | የጥገና ተቆጣጠሪ | ☐ | |

### `role.staff` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.staff` | Staff | አስጋር | ☐ | |

### `role.sys_admin` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `role.sys_admin` | System administrator | የሲስተም አስተዳደር | ☐ | |


## shell — App shell, header, sidebar

### `shell.brand` (2)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.brand.name` | New Leaf Complex | ኒው ሊፍ ኮምፕሌክስ | ☐ | |
| 2 | `shell.brand.subtitle` | Operations System | የክዋኔ ሲስተም | ☐ | |

### `shell.language` (3)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.language.am` | Amharic | አማርኛ | ☐ | |
| 2 | `shell.language.en` | English | እንግሊዝኛ | ☐ | |
| 3 | `shell.language.label` | Language | ቋንቋ | ☐ | |

### `shell.nav` (8)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.nav.close` | Close navigation menu | የአሰሳሪ ማክሪያ ዝጋ | ☐ | |
| 2 | `shell.nav.logout` | Logout | ውጣ | ☐ | |
| 3 | `shell.nav.main` | Main navigation | ዋና አሰሳሪ | ☐ | |
| 4 | `shell.nav.mobile` | Mobile navigation | የሞባይል አሰሳሪ | ☐ | |
| 5 | `shell.nav.open` | Open navigation menu | የአሰሳሪ ማክሪያ ክፈት | ☐ | |
| 6 | `shell.nav.profile` | Profile | መገለጫ | ☐ | |
| 7 | `shell.nav.sidebar` | Sidebar | ጎን | ☐ | |
| 8 | `shell.nav.userMenu` | User menu | የተጠቃሚ ማክሪያ | ☐ | |

### `shell.notifications` (2)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.notifications.label` | Notifications | ማስጠንቀቂያዎች | ☐ | |
| 2 | `shell.notifications.unread` | {count} unread | {count} ያልተነበበ | ☐ | |

### `shell.search` (4)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.search.empty` | No requests or suggestions match “{query}” | ከ“{query}” ጋር የሚዛመድ ጥያቄ ወይም ጥቁስ የለም | ☐ | |
| 2 | `shell.search.failed` | Search failed. Please try again. | ፍለጋው አልተሳካም። እባክዎ ደጋሞ ይሞክሩ። | ☐ | |
| 3 | `shell.search.label` | Global search | ግልጽ ፍለጋ | ☐ | |
| 4 | `shell.search.placeholder` | Search requests, suggestions, ticket #... | ጥያቄዎች፣ ጥቁሶች፣ ትክክት ቁጥር ይፈልጉ... | ☐ | |

### `shell.signage` (3)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.signage.healthy` | Digital signage is healthy | ዲጂታል ሳይኔስ ጥሩ ሁኔታ ላይ ነው | ☐ | |
| 2 | `shell.signage.label` | Digital signage | ዲጂታል ሳይኔስ | ☐ | |
| 3 | `shell.signage.offline` | {count} signage device(s) offline | {count} የሳይኔስ መሣሪያ(ዎች) ከመስመር ውጪ | ☐ | |

### `shell.theme` (4)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `shell.theme.dark` | Dark theme | ጨለማ ገጽታ | ☐ | |
| 2 | `shell.theme.light` | Light theme | ብሩህ ገጽታ | ☐ | |
| 3 | `shell.theme.system` | Match system theme | ከሲስተም ገጽታ ጋር አስማማ | ☐ | |
| 4 | `shell.theme.toggle` | Switch theme | ገጽታ ቀይር | ☐ | |


## staff — Staff dashboard and request forms

### `staff.dashboard` (21)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.dashboard.list.open.empty` | No open requests | ክፍት ጥያቄ የለም | ☐ | |
| 2 | `staff.dashboard.list.open.title` | My Open Requests | የእኔ ክፍት ጥያቄዎች | ☐ | |
| 3 | `staff.dashboard.list.recent.empty` | No recent updates | የቅርብ ማሻሻያ የለም | ☐ | |
| 4 | `staff.dashboard.list.recent.title` | Recently Updated Requests | በቅርብ የተዘምነው ጥያቄዎች | ☐ | |
| 5 | `staff.dashboard.list.resolved.empty` | No resolved requests yet | የተፈታ ጥያቄ እስካሁን የለም | ☐ | |
| 6 | `staff.dashboard.list.resolved.title` | My Resolved Requests | የእኔ የተፈታቸው ጥያቄዎች | ☐ | |
| 7 | `staff.dashboard.list.suggestions.empty` | No suggestions yet | ጥቁስ እስካሁን የለም | ☐ | |
| 8 | `staff.dashboard.list.suggestions.title` | My Suggestions | የእኔ ጥቁሶች | ☐ | |
| 9 | `staff.dashboard.quick.it.desc` | Report computer, network, printer, or software problems | የኮምፒዩተር፣ የአውታር ኔት፣ የማታሪንት ወይም የሶፍትወር ችግሮችን ያሳውቁ። | ☐ | |
| 10 | `staff.dashboard.quick.it.title` | IT Support Request | የአይቲ ድጋፍ ጥያቄ | ☐ | |
| 11 | `staff.dashboard.quick.maintenance.desc` | Report facility, equipment, plumbing, or electrical issues | የመሣሪያ አያያዝ፣ የቢሮንግ ወይም የኤሌክትሪክ ችግሮችን ያሳውቁ። | ☐ | |
| 12 | `staff.dashboard.quick.maintenance.title` | Maintenance Request | የጥገና ጥያቄ | ☐ | |
| 13 | `staff.dashboard.quick.suggestion.desc` | Share an idea to improve the hospital | ሆስፒታሉን ለማሻሻል የሚያግዝ አስተያየት ያጋሩ። | ☐ | |
| 14 | `staff.dashboard.quick.suggestion.title` | Staff Suggestion | የአስጋር ጥቁስ | ☐ | |
| 15 | `staff.dashboard.showing` | Showing {period} ({requests} requests, {suggestions} suggestions) | {period} ታይቷል ({requests} ጥያቄዎች፣ {suggestions} ጥቁሶች) | ☐ | |
| 16 | `staff.dashboard.stat.open` | Open Requests | ክፍት ጥያቄዎች | ☐ | |
| 17 | `staff.dashboard.stat.recentlyUpdated` | Recently Updated | በቅርብ የተዘምነው | ☐ | |
| 18 | `staff.dashboard.stat.resolved` | Resolved Requests | የተፈታቸው ጥያቄዎች | ☐ | |
| 19 | `staff.dashboard.stat.suggestions` | My Suggestions | የእኔ ጥቁሶች | ☐ | |
| 20 | `staff.dashboard.subtitle` | Submit and track your requests | ጥያቄዎችዎን ያስገቡ፣ ግምት ያድርጉ | ☐ | |
| 21 | `staff.dashboard.title` | My Dashboard | የእኔ ዳሽቦርድ | ☐ | |

### `staff.form` (20)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.form.autoAssigned` | Assigned automatically on submission | በማስገባቱ በራሱ ይመደባል | ☐ | |
| 2 | `staff.form.contactInfo` | Contact Information (optional) | የግንኙነት መረጃ (አማራጭ) | ☐ | |
| 3 | `staff.form.contactPlaceholder` | e.g. Extension 5421 | ለምሳሌ፦ የውስጥ መልጥ ቁጥር 5421 | ☐ | |
| 4 | `staff.form.createdDate` | Created Date | የተፈጠረበት ቀን | ☐ | |
| 5 | `staff.form.describeProblem` | Describe the problem in detail... | ችግሩን በዝርዝር ይግለጹ... | ☐ | |
| 6 | `staff.form.failed` | Failed to submit request | ጥያቄውን መላክ አልተቻለም | ☐ | |
| 7 | `staff.form.fileHint` | Up to 5 files, max 10 MB each. | እስከ 5 ፋይሎች፣ እያንዳንዱ እስከ 10 MB። | ☐ | |
| 8 | `staff.form.problemDescription` | Problem Description | የችግር መግለጫ | ☐ | |
| 9 | `staff.form.problemTitle` | Problem Title | የችግር ርዕስ | ☐ | |
| 10 | `staff.form.removeFile` | Remove {name} | {name} አስወግድ | ☐ | |
| 11 | `staff.form.requestedBy` | Requested by | ያጠየቀው | ☐ | |
| 12 | `staff.form.requiredFields` | Please fill in all required fields | እባክዎ ሁሉንም የሚያስፈልጉት መስክ ይሞሉ። | ☐ | |
| 13 | `staff.form.selectCategory` | Select category | ዘርፍ ይምረጡ | ☐ | |
| 14 | `staff.form.submitAnother` | Submit Another Request | ሌላ ጥያቄ ያስገቡ | ☐ | |
| 15 | `staff.form.submitRequest` | Submit Request | ጥያቄ አስገባ | ☐ | |
| 16 | `staff.form.submittedBy` | Submitted by | ያስገባው | ☐ | |
| 17 | `staff.form.submitting` | Submitting... | በመገባበቅ ላይ… | ☐ | |
| 18 | `staff.form.ticketNumber` | Ticket Number | የትክክት ቁጥር | ☐ | |
| 19 | `staff.form.uploadFiles` | Upload files | ፋይሎች ይጫኑ | ☐ | |
| 20 | `staff.form.viewMyRequests` | View My Requests | የእኔ ጥያቄዎችን ይመልከቱ | ☐ | |

### `staff.it` (6)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.it.form.locationPlaceholder` | e.g. Ward 2, Nursing Station | ለምሳሌ፦ ወረፍ 2፣ የነርስ ጣቢያ | ☐ | |
| 2 | `staff.it.form.subtitle` | Report a technology problem | የቴክኖሎጂ ችግር ያሳውቁ | ☐ | |
| 3 | `staff.it.form.success` | IT Ticket {number} submitted successfully | የአይቲ ትክክት {number} በተሳንቷል | ☐ | |
| 4 | `staff.it.form.titlePlaceholder` | e.g. Computer not starting | ለምሳሌ፦ ኮምፒዩተር አይጀምርም | ☐ | |
| 5 | `staff.it.submitted.message` | Your IT support request has been sent to the IT team. | የአይቲ ድጋፍ ጥያቄዎ ወደ የአይቲ ቡድን ተልኳል። | ☐ | |
| 6 | `staff.it.submitted.title` | Request Submitted | ጥያቄው ተልኳል | ☐ | |

### `staff.maintenance` (11)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.maintenance.form.equipmentName` | Equipment Name | የመሣሪያ ስም | ☐ | |
| 2 | `staff.maintenance.form.equipmentPlaceholder` | e.g. Refrigerator, X-Ray machine | ለምሳሌ፦ ቆላማዊ፣ የኤክስሬይ ማሽከርከር | ☐ | |
| 3 | `staff.maintenance.form.locationPlaceholder` | e.g. Ward 1, Room 104 | ለምሳሌ፦ ወረፍ 1፣ ክፍል 104 | ☐ | |
| 4 | `staff.maintenance.form.photoHint` | Up to 5 photos, max 10 MB each. | እስከ 5 ፎቶዎች፣ እያንዳንዱ እስከ 10 MB። | ☐ | |
| 5 | `staff.maintenance.form.problemCategory` | Problem Category | የችግር ዘርፍ | ☐ | |
| 6 | `staff.maintenance.form.subtitle` | Report a facility or equipment problem | የመሣሪያ ወይም የአያያዝ ችግር ያሳውቁ | ☐ | |
| 7 | `staff.maintenance.form.success` | Maintenance Request {number} submitted successfully | የጥገና ጥያቄ {number} በተሳንቷል | ☐ | |
| 8 | `staff.maintenance.form.titlePlaceholder` | e.g. Sink is leaking continuously | ለምሳሌ፦ ቢላ ቀጥ ብቋርጭቷል | ☐ | |
| 9 | `staff.maintenance.form.uploadPhotos` | Upload photos | ፎቶዎች ይጫኑ | ☐ | |
| 10 | `staff.maintenance.submitted.message` | Your maintenance request has been sent to the maintenance team. | የጥገና ጥያቄዎ ወደ የጥገና ቡድን ተልኳል። | ☐ | |
| 11 | `staff.maintenance.submitted.title` | Request Submitted | ጥያቄው ተልኳል | ☐ | |

### `staff.requests` (26)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.requests.action.confirmCompletion` | Confirm completion | መጠናቀቅን ያረጋግጡ | ☐ | |
| 2 | `staff.requests.action.confirmResolution` | Confirm resolution | መፍታትን ያረጋግጡ | ☐ | |
| 3 | `staff.requests.action.provideInfo` | Provide info | መረጃ ይስጡ | ☐ | |
| 4 | `staff.requests.aria.stages` | Filter by stage | በደረጃ ያጣሩ | ☐ | |
| 5 | `staff.requests.aria.types` | Request types | የጥያቄ ዘርፎች | ☐ | |
| 6 | `staff.requests.empty.subtitle` | Submit a new request to get started | ለመጀመር አዲስ ጥያቄ ያስገቡ | ☐ | |
| 7 | `staff.requests.empty.title` | No requests found | ጥያቄዎች አልተገኙም | ☐ | |
| 8 | `staff.requests.footer.lead` | Every assignment, reply and status change also arrives in your | የዕቅት፣ የመልስ እና የሁኔታ ለውጥ ሁሉም በእርስዎ የሚደርሱበት | ☐ | |
| 9 | `staff.requests.footer.notifications` | notifications | ማስጠንቀቂያዎች | ☐ | |
| 10 | `staff.requests.footer.tail` | . | ። | ☐ | |
| 11 | `staff.requests.stage.active` | In progress | በሂደት ላይ | ☐ | |
| 12 | `staff.requests.stage.all` | All stages | ሁሉም ደረጃዎች | ☐ | |
| 13 | `staff.requests.stage.done` | Finished | ተጠናቋል | ☐ | |
| 14 | `staff.requests.stage.waiting` | Waiting on me | እኔ ላይ የሚጠበቅ | ☐ | |
| 15 | `staff.requests.subtitle.all` | Track all your submitted requests | ያስገቁትን ሁሉንም ጥያቄዎች ይከታተሉ | ☐ | |
| 16 | `staff.requests.subtitle.it` | Your submitted IT support requests | ያስገቁት የአይቲ ድጋፍ ጥያቄዎች | ☐ | |
| 17 | `staff.requests.subtitle.maintenance` | Your submitted maintenance requests | ያስገቁት የጥገና ጥያቄዎች | ☐ | |
| 18 | `staff.requests.subtitle.suggestion` | Your submitted suggestions | ያስገቁት ጥቁሶች | ☐ | |
| 19 | `staff.requests.tab.it` | IT Requests | የአይቲ ጥያቄዎች | ☐ | |
| 20 | `staff.requests.tab.suggestions` | Suggestions | ጥቁሶች | ☐ | |
| 21 | `staff.requests.table.handledBy` | Handled by | የሚያስተናግድው | ☐ | |
| 22 | `staff.requests.table.number` | No. | ቁ. | ☐ | |
| 23 | `staff.requests.title.all` | My Requests | የእኔ ጥያቄዎች | ☐ | |
| 24 | `staff.requests.title.it` | My IT Requests | የእኔ የአይቲ ጥያቄዎች | ☐ | |
| 25 | `staff.requests.title.maintenance` | My Maintenance Requests | የእኔ የጥገና ጥያቄዎች | ☐ | |
| 26 | `staff.requests.title.suggestion` | My Suggestions | የእኔ ጥቁሶች | ☐ | |

### `staff.suggestion` (20)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `staff.suggestion.form.attachmentsOptional` | Attachments (optional) | ማጣቪያዎች (አማራጭ) | ☐ | |
| 2 | `staff.suggestion.form.benefitPlaceholder` | What benefits do you expect? | ምን ጥቅሞች ይጠበቃሉ? | ☐ | |
| 3 | `staff.suggestion.form.expectedBenefit` | Expected Benefit | የሚጠበቅ ጥቅም | ☐ | |
| 4 | `staff.suggestion.form.failed` | Failed to submit suggestion | ጥቁሱን መላክ አልተቻለም | ☐ | |
| 5 | `staff.suggestion.form.problemOpportunity` | Problem / Opportunity | ችግር / እድል | ☐ | |
| 6 | `staff.suggestion.form.problemPlaceholder` | What problem or opportunity have you identified? | ምን ችግር ወይስም እድል አለዎት? | ☐ | |
| 7 | `staff.suggestion.form.proposedImprovement` | Proposed Improvement | የተጠበቀ ማሻሻያ | ☐ | |
| 8 | `staff.suggestion.form.solutionPlaceholder` | What is your proposed solution? | የተጠበቀዎ መፍትሔ ምንድር? | ☐ | |
| 9 | `staff.suggestion.form.submit` | Submit Suggestion | ጥቁስ አስገባ | ☐ | |
| 10 | `staff.suggestion.form.submitAnother` | Submit Another Suggestion | ሌላ ጥቁስ ያስገቡ | ☐ | |
| 11 | `staff.suggestion.form.subtitle` | Share an idea to improve the hospital | ሆስፒታሉን ለማሻሻል የሚያግዝ አስተያየት ያጋሩ። | ☐ | |
| 12 | `staff.suggestion.form.success` | Suggestion {number} submitted successfully | ጥቁስ {number} በተሳንቷል | ☐ | |
| 13 | `staff.suggestion.form.suggestionNumber` | Suggestion Number | የጥቁስ ቁጥር | ☐ | |
| 14 | `staff.suggestion.form.suggestionTitle` | Suggestion Title | የጥቁስ ርዕስ | ☐ | |
| 15 | `staff.suggestion.form.title` | Submit Staff Suggestion | የአስጋር ጥቁስ ያስገቡ | ☐ | |
| 16 | `staff.suggestion.form.titlePlaceholder` | e.g. Improve patient direction signs | ለምሳሌ፦ የተሞክሮ አቅጣጫ ሰሌዳዎችን ማሻሻል | ☐ | |
| 17 | `staff.suggestion.form.titleRequired` | Please enter a suggestion title | እባክዎ የጥቁስ ርዕስ ያስገቡ | ☐ | |
| 18 | `staff.suggestion.submitted.message` | Thank you! Your improvement idea has been sent to the review team. | አመሰግናለሁ! የማሻሻያ አስተያየትዎ ወደ የግምገማ ቡድን ተልኳል። | ☐ | |
| 19 | `staff.suggestion.submitted.title` | Suggestion Submitted | ጥቁሱ ተልኳል | ☐ | |
| 20 | `staff.suggestion.submitted.viewSuggestions` | View My Suggestions | የእኔ ጥቁሶችን ይመልከቱ | ☐ | |


## status — Workflow and device status values

### `status.accepted` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.accepted` | Accepted | ተቀብሏል | ☐ | |

### `status.active` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.active` | Active | ንቁ | ☐ | |

### `status.alreadyPlanned` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.alreadyPlanned` | Already Planned | ቀደም ብሎ ተቀድቷል | ☐ | |

### `status.archived` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.archived` | Archived | በማህደር ውስጥ | ☐ | |

### `status.assigned` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.assigned` | Assigned | ተመደቧል | ☐ | |

### `status.closed` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.closed` | Closed | ተዘግቷል | ☐ | |

### `status.completed` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.completed` | Completed | ተጠናቋል | ☐ | |

### `status.disabled` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.disabled` | Disabled | ተሰክሯል | ☐ | |

### `status.draft` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.draft` | Draft | ረቂቅ | ☐ | |

### `status.ended` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.ended` | Ended | ተጠናቋል | ☐ | |

### `status.failed` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.failed` | Failed | አልተሳካም | ☐ | |

### `status.forwardedToDepartment` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.forwardedToDepartment` | Forwarded to Department | ወደ ክፍል ተላክቷል | ☐ | |

### `status.idle` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.idle` | Idle | ቁም በቁም | ☐ | |

### `status.implementation` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.implementation` | Implementation | አፈጻጸም | ☐ | |

### `status.implemented` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.implemented` | Implemented | ተፈጽሟል | ☐ | |

### `status.inProgress` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.inProgress` | In Progress | በሂደት ላይ | ☐ | |

### `status.inspection` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.inspection` | Inspection | ምርመራ | ☐ | |

### `status.needsMoreInformation` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.needsMoreInformation` | Needs More Information | ተጨማሪ መረጃ ያስፈልጋል | ☐ | |

### `status.new` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.new` | New | አዲስ | ☐ | |

### `status.notSupported` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.notSupported` | Not supported | አይደገፍም | ☐ | |

### `status.offline` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.offline` | Offline | ከመስመር ውጪ | ☐ | |

### `status.online` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.online` | Online | በመስመር ላይ | ☐ | |

### `status.paused` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.paused` | Paused | ቆሟል | ☐ | |

### `status.pending` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.pending` | Pending | በመጠባበቅ ላይ | ☐ | |

### `status.playing` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.playing` | Playing | በስርጭት ላይ | ☐ | |

### `status.rejected` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.rejected` | Rejected | ውድቅ ተደርጓል | ☐ | |

### `status.resolved` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.resolved` | Resolved | ተፈትሏል | ☐ | |

### `status.sent` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.sent` | Sent | ተልኳል | ☐ | |

### `status.submitted` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.submitted` | Submitted | ተልኳል | ☐ | |

### `status.succeeded` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.succeeded` | Succeeded | ተሳክቷል | ☐ | |

### `status.underReview` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.underReview` | Under Review | በግምገማ ላይ | ☐ | |

### `status.unknown` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.unknown` | Unknown | ያልታወቀ | ☐ | |

### `status.waitingForInformation` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.waitingForInformation` | Waiting for Information | ለመረጃ በመጠበቅ ላይ | ☐ | |

### `status.waitingForParts` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `status.waitingForParts` | Waiting for Parts | ለክፍሎች በመጠበቅ ላይ | ☐ | |


## type — Request types (IT, maintenance, suggestion)

### `type.it` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `type.it` | IT | አይቲ | ☐ | |

### `type.maintenance` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `type.maintenance` | Maintenance | ጥገና | ☐ | |

### `type.suggestion` (1)

| # | Key | English | አማርኛ | OK | Notes |
| ---: | --- | --- | --- | :---: | --- |
| 1 | `type.suggestion` | Suggestion | ጥቁስ | ☐ | |

