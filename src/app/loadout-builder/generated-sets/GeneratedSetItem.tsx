import { t } from 'app/i18next-t';
import { showItemPicker } from 'app/item-picker/item-picker';
import Sockets from 'app/loadout/loadout-ui/Sockets';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import { AppIcon, faRandom, lockIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { Dispatch } from 'react';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import styles from './GeneratedSetItem.m.scss';

/**
 * Shows how we recommend the energy of this armor be changed in order to fit its mods.
 */
function EnergySwap({
  item,
  assignedMods,
}: {
  item: DimItem;
  assignedMods?: PluggableInventoryItemDefinition[];
}) {
  const armorEnergyCapacity = item.energy?.energyCapacity || 0;

  const modCost = _.sumBy(assignedMods, (mod) => mod.plug.energyCost?.energyCost || 0);
  const resultingEnergyCapacity = Math.max(armorEnergyCapacity, modCost);

  const noEnergyChange = resultingEnergyCapacity === armorEnergyCapacity;

  return (
    <div className={clsx(styles.energySwapContainer, { [styles.energyHidden]: noEnergyChange })}>
      <div className={styles.energyValue}>
        <div
          className={clsx({
            [styles.masterworked]: armorEnergyCapacity === MAX_ARMOR_ENERGY_CAPACITY,
          })}
        >
          {armorEnergyCapacity}
        </div>
      </div>
      <div className={styles.arrow}>➜</div>
      <div className={styles.energyValue}>
        <div
          className={clsx({
            [styles.masterworked]: resultingEnergyCapacity === MAX_ARMOR_ENERGY_CAPACITY,
          })}
        >
          {resultingEnergyCapacity}
        </div>
      </div>
    </div>
  );
}

/**
 * An individual item in a generated set. Includes a perk display and a button for selecting
 * alternative items with the same stat mix.
 */
export default function GeneratedSetItem({
  item,
  pinned,
  itemOptions,
  assignedMods,
  showEnergyChanges,
  lbDispatch,
}: {
  item: DimItem;
  pinned: boolean;
  itemOptions: DimItem[];
  assignedMods?: PluggableInventoryItemDefinition[];
  showEnergyChanges: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const pinItem = (item: DimItem) => lbDispatch({ type: 'pinItem', item });
  const unpinItem = () => lbDispatch({ type: 'unpinItem', item });

  const chooseReplacement = async () => {
    const ids = new Set(itemOptions.map((i) => i.id));

    try {
      const { item } = await showItemPicker({
        prompt: t('LoadoutBuilder.ChooseAlternateTitle'),
        filterItems: (item: DimItem) => ids.has(item.id),
      });

      pinItem(item);
    } catch (e) {}
  };

  const onSocketClick = (
    plugDef: PluggableInventoryItemDefinition,
    plugCategoryHashWhitelist?: number[]
  ) => {
    const { plugCategoryHash } = plugDef.plug;

    if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
      // Legendary armor can have intrinsic perks and it might be
      // nice to provide a convenient user interface for those,
      // but the exotic picker is not the way to do it.
      if (item.isExotic) {
        lbDispatch({ type: 'lockExotic', lockedExoticHash: item.hash });
      }
    } else {
      lbDispatch({
        type: 'openModPicker',
        plugCategoryHashWhitelist,
      });
    }
  };

  return (
    <div>
      {showEnergyChanges && <EnergySwap item={item} assignedMods={assignedMods} />}
      <div className={styles.item}>
        <div className={styles.swapButtonContainer}>
          <LoadoutBuilderItem item={item} onShiftClick={() => pinItem(item)} />
          {itemOptions.length > 1 ? (
            <button
              type="button"
              className={styles.swapButton}
              title={t('LoadoutBuilder.ChooseAlternateTitle')}
              onClick={chooseReplacement}
            >
              <AppIcon icon={faRandom} />
            </button>
          ) : (
            pinned && (
              <button
                type="button"
                className={styles.swapButton}
                title={t('LoadoutBuilder.UnlockItem')}
                onClick={unpinItem}
              >
                <AppIcon icon={lockIcon} />
              </button>
            )
          )}
        </div>
        <Sockets item={item} lockedMods={assignedMods} onSocketClick={onSocketClick} size="small" />
      </div>
    </div>
  );
}
