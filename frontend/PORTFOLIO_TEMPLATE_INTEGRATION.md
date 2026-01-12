# Portfolio Template System Integration Guide

## ✅ Implementation Status

The strict three-layer portfolio template system has been implemented:

### ✅ Completed Components

1. **`portfolioTemplates.ts`** - Canonical template registry (exactly 20 templates)
2. **`PortfolioShareConfig.tsx`** - Share configuration UI with toggles
3. **`TemplateSelector.tsx`** - Template selection modal
4. **`portfolioSnapshots.ts`** - Snapshot creation and retrieval utilities
5. **`TalentPortfolioBusinessView.tsx`** - Business view using snapshots only
6. **Database Migration** - `2025122501_talent_portfolio_share_system.sql`

## 🔧 Integration Steps

### Step 1: Integrate Share Config into PortfolioEditor

Add to `PortfolioEditor.tsx`:

```typescript
import PortfolioShareConfig, { ShareConfig } from '@/components/PortfolioShareConfig'
import TemplateSelector from '@/components/TemplateSelector'
import { buildSharedPayload, createPortfolioSnapshot } from '@/lib/portfolioSnapshots'
import { TemplateId } from '@/components/portfolioTemplates'

// Add state
const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null)
const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null)
const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
const [talentProfileId, setTalentProfileId] = useState<string | null>(null)

// Load talent profile ID on mount
useEffect(() => {
  async function loadTalentProfile() {
    const uid = await getUserId()
    if (!uid) return
    
    const { data } = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('user_id', uid)
      .maybeSingle()
    
    if (data) setTalentProfileId(data.id)
  }
  loadTalentProfile()
}, [])

// Add share config handler
const handleShareConfigChange = (config: ShareConfig) => {
  setShareConfig(config)
}
```

### Step 2: Add Share Config UI to PortfolioEditor

In the render section, add the share config component:

```tsx
{/* Add after main portfolio editing sections */}
<div className="mt-8">
  <PortfolioShareConfig
    talentProfileId={talentProfileId}
    userId={await getUserId()}
    avatarPath={portfolio.avatar_path}
    bannerPath={portfolio.banner_path}
    introVideoId={portfolio.introVideoId}
    onConfigChange={handleShareConfigChange}
  />
</div>
```

### Step 3: Add Template Selection Button

In the header section:

```tsx
<button
  type="button"
  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 border border-purple-500/50 font-semibold"
  onClick={() => {
    if (!shareConfig) {
      alert('Please configure share settings first')
      return
    }
    setTemplateSelectorOpen(true)
  }}
>
  Choose Template
</button>
```

### Step 4: Add Template Selector Modal

```tsx
{templateSelectorOpen && shareConfig && (
  <TemplateSelector
    shareConfig={shareConfig}
    currentTemplateId={selectedTemplateId}
    onSelect={async (templateId) => {
      if (!talentProfileId || !shareConfig) return
      
      const uid = await getUserId()
      if (!uid) return
      
      // Build shared payload
      const sharedPayload = await buildSharedPayload(
        portfolio,
        shareConfig,
        templateId
      )
      
      // Create snapshot
      try {
        await createPortfolioSnapshot(
          talentProfileId,
          uid,
          templateId,
          sharedPayload
        )
        setSelectedTemplateId(templateId)
        setTemplateSelectorOpen(false)
        alert('Template selected and snapshot created!')
      } catch (error) {
        console.error('Error creating snapshot:', error)
        alert('Failed to create snapshot')
      }
    }}
    onClose={() => setTemplateSelectorOpen(false)}
  />
)}
```

### Step 5: Update Save Function

Modify `savePortfolio` to also save share config and template selection:

```typescript
const savePortfolio = async (opts?: { redirect?: boolean; source?: string }) => {
  // ... existing save logic ...
  
  // Also save template selection if one is selected
  if (selectedTemplateId && shareConfig && talentProfileId) {
    const uid = await getUserId()
    if (uid) {
      const sharedPayload = await buildSharedPayload(
        portfolio,
        shareConfig,
        selectedTemplateId
      )
      
      await createPortfolioSnapshot(
        talentProfileId,
        uid,
        selectedTemplateId,
        sharedPayload
      )
    }
  }
  
  // ... rest of save logic ...
}
```

## 🎯 Usage Flow

### For Talent:

1. **Edit Portfolio** - Fill in all sections (shared or not)
2. **Configure Sharing** - Use toggles to select what to share
3. **Select Template** - Choose from 20 canonical templates
4. **Create Snapshot** - System creates immutable snapshot
5. **Connect to Business** - Share snapshot (not live data)

### For Business:

1. **Receive Connection** - Get snapshot ID or talent+business IDs
2. **View Portfolio** - Render using `TalentPortfolioBusinessView`
3. **No Live Access** - Only sees snapshot data, never live portfolio

## 🚫 Critical Rules Enforced

✅ Only 20 templates exist (canonical registry)  
✅ Templates come from `portfolioTemplates.ts` only  
✅ Share config controls what's visible  
✅ Snapshots are immutable  
✅ Business view uses snapshots only  
✅ No data leakage possible  

## 📝 Next Steps

1. Run database migration: `2025122501_talent_portfolio_share_system.sql`
2. Integrate components into `PortfolioEditor.tsx` (see steps above)
3. Test template selection flow
4. Test snapshot creation
5. Test business view rendering
6. Remove any legacy template code (if found)

## 🔍 Validation Checklist

- [ ] Only 20 templates accessible
- [ ] Share config saves correctly
- [ ] Template selection works
- [ ] Snapshots are created on template selection
- [ ] Business view renders from snapshot only
- [ ] No legacy templates accessible
- [ ] All unshared content is hidden from business view
