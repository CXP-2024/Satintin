# Card Collection Components

This folder contains the refactored components from the original `CardCollectionPage.tsx` file. The large monolithic component has been broken down into smaller, more maintainable components.

## File Structure

```
cardCollection/
├── README.md                      # This file
├── index.ts                       # Main exports
├── cardCollectionTypes.ts         # Type definitions
├── cardCollectionConstants.ts     # Constants and static data
├── cardCollectionUtils.ts         # Utility functions
├── DeckManager.tsx               # Main deck management component
├── SelectedDeckArea.tsx          # Shows selected cards in deck
├── DeckActions.tsx               # Deck action buttons (recommend, clear, confirm)
├── CardSelectionArea.tsx         # Card selection grid
└── AllCardsTab.tsx               # All cards tab view
```

## Component Breakdown

### Core Components

1. **DeckManager** - Main component for deck management tab
   - Handles card selection logic
   - Manages deck state
   - Integrates sub-components

2. **AllCardsTab** - Component for displaying all available cards
   - Shows card templates
   - Handles ownership status
   - Manages selection from all cards view

3. **SelectedDeckArea** - Shows currently selected cards
   - Displays selected deck (max 3 cards)
   - Handles card removal
   - Shows empty state

4. **DeckActions** - Action buttons for deck operations
   - Recommend button (auto-select optimal cards)
   - Clear button (remove all selected cards)
   - Confirm button (save deck configuration)

5. **CardSelectionArea** - Grid for selecting cards
   - Shows available cards for selection
   - Handles left/right click interactions
   - Shows remaining card counts

### Support Files

1. **cardCollectionTypes.ts** - TypeScript interfaces
   - `ExtendedCardEntry` - Enhanced card data structure
   - `CardTemplate` - Card template from backend
   - Component prop interfaces

2. **cardCollectionConstants.ts** - Static data
   - `CARD_TYPES` - Card type definitions with effects
   - `RARITIES` - Rarity information with colors and stars
   - `CARDS_DATA` - Legacy card data for reference

3. **cardCollectionUtils.ts** - Utility functions
   - `getCardKey()` - Generate unique card identifiers
   - `getRarityInfo()` - Get rarity display information
   - `getTypeInfo()` - Get card type information
   - `processUserCards()` - Handle deduplication and counting
   - `generateRecommendedDeck()` - Auto-recommendation logic

## Usage

### In CardCollectionPage.tsx

```tsx
import { 
  DeckManager, 
  AllCardsTab, 
  ExtendedCardEntry, 
  CardTemplate, 
  TabType 
} from '../components/cardCollection';

// Use DeckManager for deck management
<DeckManager
  userCards={userCards}
  selected={selected}
  onSelectionChange={setSelected}
  onConfirmDeck={handleConfirmDeck}
/>

// Use AllCardsTab for showing all cards
<AllCardsTab
  allCardTemplates={allCardTemplates}
  userCards={userCards}
  selected={selected}
  onSelect={handleSelect}
  isLoading={isLoading}
  isLoadingTemplates={isLoadingTemplates}
  error={error}
/>
```

## Benefits of Refactoring

1. **Improved Maintainability** - Each component has a single responsibility
2. **Better Testability** - Components can be tested in isolation
3. **Increased Reusability** - Components can be used in other contexts
4. **Cleaner Code** - Smaller, focused components are easier to understand
5. **Better Type Safety** - Dedicated types file ensures consistency
6. **Separation of Concerns** - Logic, UI, and data are properly separated

## Migration Notes

- The original `CardCollectionPage.tsx` now uses these refactored components
- All existing functionality is preserved
- CSS classes remain the same for styling compatibility
- API calls and data flow remain unchanged
