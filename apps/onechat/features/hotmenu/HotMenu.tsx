import { Slash } from '@tamagui/lucide-icons'
import { useHotkeys } from 'react-hotkeys-hook'
import { Button } from '~/interface/Button'
import { updateUserState, useUserState } from '../auth/useUserState'
import { Dialog, Input } from 'tamagui'

export const HotMenu = () => {
  const userState = useUserState()
  const showHotMenu = !!userState?.showHotMenu

  function toggleHotMenu() {
    updateUserState({
      showHotMenu: !showHotMenu,
    })
  }

  useHotkeys('/', () => {
    toggleHotMenu()
  })

  useHotkeys(
    'Escape',
    () => {
      toggleHotMenu()
    },
    {
      enabled: showHotMenu,
    }
  )

  return (
    <>
      <Button
        onPress={() => {
          toggleHotMenu()
        }}
      >
        <Slash size={12} />
      </Button>

      <Dialog modal open={showHotMenu}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quickest"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            bg="$background075"
          />

          <Dialog.Content
            bordered
            elevate
            bg="$color2"
            key="content"
            animation={[
              'quickest',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -10, opacity: 0 }}
            exitStyle={{ x: 0, y: 10, opacity: 0 }}
            gap="$4"
            w="80%"
            h="80%"
          >
            <Input
              onKeyPress={(key) => {
                if (key.nativeEvent.key === 'Escape') {
                  toggleHotMenu()
                }
              }}
              size="$6"
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}