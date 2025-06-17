import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import React from 'react'
import FunnelEditorSidebar from './_components/funnel-editor-sidebar'
import EditorProvider from '@/providers/editor/editor-provider'
import FunnelEditor from './_components/funnel-editor'
import FunnelEditorNavigation from './_components/funnel-editor-navigation'
import Code from '@/app/(main)/subaccount/[subaccountId]/funnels/[funnelId]/editor/code/[funnelPageId]/page'

type Props = {
  params: {
    subaccountId: string
    funnelId: string
    funnelPageId: string
  }
}

const Page = async ({ params }: Props) => {
  const funnelPageDetails = await db.funnelPage.findFirst({
    where: {
      id: params.funnelPageId,
    },
  })
  if (!funnelPageDetails) {
    return redirect(
      `/subaccount/${params.subaccountId}/funnels/${params.funnelId}`
    )
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 z-[20] bg-background flex flex-col">
      <EditorProvider
        subaccountId={params.subaccountId}
        funnelId={params.funnelId}
        pageDetails={funnelPageDetails}
      >
        <FunnelEditorNavigation
          funnelId={params.funnelId}
          funnelPageDetails={funnelPageDetails}
          subaccountId={params.subaccountId}
          funnelPageId={params.funnelPageId}
      
        />
        <div className="h-full flex justify-center overflow-hidden">
          <FunnelEditor funnelPageId={params.funnelPageId}/>
          {/*<Code params={{
            subaccountId: params.subaccountId,
            funnelId: params.funnelId,
            funnelPageId: params.funnelPageId
          }}/>*/}
        </div>

        <FunnelEditorSidebar subaccountId={params.subaccountId} />
      </EditorProvider>
    </div>
  )
}

export default Page