'use client'
import Loading from '@/components/global/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getFunnelPageCode, saveActivityLogsNotification, upsertFunnelPage } from '@/lib/queries'
import { DeviceTypes, useEditor } from '@/providers/editor/editor-provider'
import { FunnelPage } from '@prisma/client'
import clsx from 'clsx'
import {
  ArrowLeftCircle,
  Code,
  EyeIcon,
  Laptop,
  LoaderIcon,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { FocusEventHandler, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  funnelId: string
  funnelPageDetails: FunnelPage
  subaccountId: string
  funnelPageId:string
}



const FunnelEditorNavigation = ({
  funnelId,
  funnelPageDetails,
  subaccountId,
  funnelPageId,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const { state, dispatch } = useEditor()
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  useEffect(() => {
    dispatch({
      type: 'SET_FUNNELPAGE_ID',
      payload: { funnelPageId: funnelPageDetails.id },
    })
  }, [funnelPageDetails])

  useEffect(() => {
    const interval = setInterval(() => {
      handleOnSave(true) // Autosave
    }, 30000) // Autosave every 60 seconds
    return () => clearInterval(interval)
  }, [state.editor.elements])

  const handleOnBlurTitleChange: FocusEventHandler<HTMLInputElement> = async (
    event
  ) => {
    if (event.target.value === funnelPageDetails.name) return
    if (event.target.value) {
      await upsertFunnelPage(
        subaccountId,
        {
          id: funnelPageDetails.id,
          name: event.target.value,
          order: funnelPageDetails.order,
        },
        funnelId
      )

      toast('Success', {
        description: 'Saved Funnel Page title',
      })
      router.refresh()
    } else {
      toast('Oppse!', {
        description: 'You need to have a title!',
      })
      event.target.value = funnelPageDetails.name
    }
  }

  const handlePreviewClick = () => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE' })
    dispatch({ type: 'TOGGLE_LIVE_MODE' })
  }

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
  }

  const handleRedo = () => {
    dispatch({ type: 'REDO' })
  }

  const handleOnSave = async (isAutoSave = false) => {
    if (isAutoSave && isLoading) return // Prevent overlapping saves

    isAutoSave ? setIsAutoSaving(true) : setIsLoading(true)
    const content = JSON.stringify(state.editor.elements)
    try {
      const response = await upsertFunnelPage(
        subaccountId,
        { ...funnelPageDetails, content },
        funnelId
      )
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a funnel page | ${response?.name}`,
        subaccountId: subaccountId,
      })
      toast('Success', { description: isAutoSave ? 'Autosaved Editor' : 'Saved Editor' })
    } catch (error) {
      if (!isAutoSave) {
        toast('Oops!', { description: 'Could not save editor' })
      }
    } finally {
      isAutoSave ? setIsAutoSaving(false) : setIsLoading(false)
    }
  }



  return (
    <TooltipProvider>
      <nav
        className={clsx(
          'flex flex-row border-b-[1px] items-center justify-between p-6 gap-2 transition-all z-50',
          { '!h-0 !p-0 !overflow-hidden': state.editor.previewMode }
        )}
      >
        <aside className="flex flex-col gap-4 max-w-[260px] w-[300px]">
          <div className='flex items-center w-full gap-2'>
          <Link href={`/subaccount/${subaccountId}/funnels/${funnelId}`}>
            <ArrowLeftCircle />
          </Link>
          <div className="flex flex-col w-full ">
            <Input
              defaultValue={funnelPageDetails.name}
              className="border-none h-5 m-0 p-0 text-lg"
              onBlur={handleOnBlurTitleChange}
            />
            <span className="text-sm text-muted-foreground">
              Path: /{funnelPageDetails.pathName}
            </span>
          </div>
          </div>
        </aside>
        <aside>
          <Tabs
            defaultValue="Desktop"
            className="w-fit "
            value={state.editor.device}
            onValueChange={(value) => {
              dispatch({
                type: 'CHANGE_DEVICE',
                payload: { device: value as DeviceTypes },
              })
            }}
          >
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-fit">
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Desktop"
                    className="data-[state=active]:bg-muted w-10 h-10 p-0"
                  >
                    <Laptop />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Desktop</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Tablet"
                    className="w-10 h-10 p-0 data-[state=active]:bg-muted"
                  >
                    <Tablet />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tablet</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <TabsTrigger
                    value="Mobile"
                    className="w-10 h-10 p-0 data-[state=active]:bg-muted"
                  >
                    <Smartphone />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  {/*Pani aanu mone */}
                  <div 
                      onClick={async () => {
                        console.log('Clickids')
                        router.push(`/subaccount/${subaccountId}/funnels/${funnelId}/editor/code/${funnelPageId}`);
                      }}>
                  <TabsTrigger
                    value="Code"
                    className="w-10 h-10 p-0 data-[state=active]:bg-muted"
                    
                  >
                    <Code/>
                  </TabsTrigger>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Code</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>
        </aside>
        <aside className="flex items-center gap-2">
          <Button
            variant={'ghost'}
            size={'icon'}
            className="hover:bg-slate-800"
            onClick={handlePreviewClick}
          >
            <EyeIcon />
          </Button>
          <Button
            disabled={!(state.history.currentIndex > 0)}
            onClick={handleUndo}
            variant={'ghost'}
            size={'icon'}
            className="hover:bg-slate-800"
          >
            <Undo2 />
          </Button>
          <Button
            disabled={
              !(state.history.currentIndex < state.history.history.length - 1)
            }
            onClick={handleRedo}
            variant={'ghost'}
            size={'icon'}
            className="hover:bg-slate-800 mr-4"
          >
            <Redo2 />
          </Button>
          <div className="flex flex-col item-center mr-4">
            {/*<div className="flex flex-row items-center gap-4">
              Draft
              <Switch
                disabled
                defaultChecked={true}
              />
              Publish
            </div>*/}
            <span className="text-muted-foreground text-sm">
              Last updated {funnelPageDetails.updatedAt.toLocaleDateString()}
            </span>
          </div>
          {!isLoading && !isAutoSaving ? <Button onClick={() => handleOnSave(false)}>Save</Button> : <Loading />}
          {isAutoSaving && <span className="text-sm text-muted-foreground">Autosaving...</span>}
        </aside>
      </nav>
    </TooltipProvider>
  )
}

export default FunnelEditorNavigation