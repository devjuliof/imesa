import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AddonOption } from './AddonOption'
import { colors, spacing } from '../../theme'
import type { PublicAddonGroup, PublicAddonItem } from '../../types'

interface SelectedItem {
  itemId: string
  quantity: number
}

interface AddonGroupProps {
  group: PublicAddonGroup
  selectedItems: SelectedItem[]
  onSelectItem: (item: PublicAddonItem) => void
  primaryColor?: string
}

export const AddonGroup: React.FC<AddonGroupProps> = ({
  group,
  selectedItems,
  onSelectItem,
  primaryColor = colors.primary,
}) => {
  const isSingleSelection = group.maxSelections === 1
  const selectionType = isSingleSelection ? 'single' : 'multiple'

  const getSelectionText = () => {
    if (group.isRequired) {
      if (isSingleSelection) {
        return 'Escolha apenas 1 item'
      }
      return `Escolha de ${group.minSelections} a ${group.maxSelections} itens`
    }
    if (isSingleSelection) {
      return 'Escolha até 1 item (opcional)'
    }
    return `Escolha até ${group.maxSelections} itens (opcional)`
  }

  const isItemSelected = (itemId: string) => {
    return selectedItems.some((s) => s.itemId === itemId)
  }

  return (
    <View style={styles.container}>
      {group.items.map((item) => (
        <AddonOption
          key={item.id}
          id={item.id}
          name={item.name}
          priceCents={item.priceCents}
          isSelected={isItemSelected(item.id)}
          onSelect={() => onSelectItem(item)}
          selectionType={selectionType}
          primaryColor={primaryColor}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
})
