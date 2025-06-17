'use server'

import { clerkClient, currentUser, } from "@clerk/nextjs/server"
import { db } from "./db"
import { redirect } from "next/navigation"
import { Agency, Lane, Plan, Prisma, Role, SubAccount, Tag, Ticket, User } from "@prisma/client"
import { userAgent } from "next/server"
import { v4 } from "uuid"
import { connect } from "http2"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { CreateFunnelFormSchema, CreateMediaType, UpsertFunnelPage } from "./types"


export const getAuthUserDetails = async () => {
    const user = await currentUser()
    if (!user) {
      return
    }
    
    const userData = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
      include: {
        Agency: {
          include: {
            SidebarOption: true,
            SubAccount: {
              include: {
                SidebarOption: true,
              },
            },
          },
        },
        Permissions: true,
      },
    })
  
    return userData
  }

export const saveActivityLogsNotification=async({
    agencyId,
    description,
    subaccountId,
}:{
    agencyId?:string
    description:string
    subaccountId?:string
})=>{
    const authUser=await currentUser()
    let userData;
    if(!authUser){
        const response= await db.user.findFirst({
            where:{
                Agency:{
                    SubAccount:{
                        some:{
                            id:subaccountId
                        },
                    },
                },
            },
        })
        if(response){
            userData=response
        }
    }
    else{
        userData=await db.user.findUnique({
            where:{email: authUser?.emailAddresses[0].emailAddress},
        })
    }
    if(!userData)
    {
        console.log("Could not find a user")
        return
    }
    let foundAgencyId=agencyId
    if(!foundAgencyId)
    {
        if(!subaccountId)
        {
            throw new Error("You need to provide atleast an agency id or subaccount id")
        }
    
        const response= await db.subAccount.findUnique({
            where:{id:subaccountId},
        })
        if(response) foundAgencyId=response.agencyId
    }
    if(subaccountId){
        await db.notification.create({
            data:{
                notification: `${userData.name} | ${description}`,
                User:{connect: {
                    id: userData.id,
                },
            },
            Agency: {
                connect: {
                    id: foundAgencyId,
                },
            },
            SubAccount:{
                connect:{
                    id: subaccountId
                },
            },
            },

        })
    }
    else{
        await db.notification.create({data:{
            notification: `${userData.name} | ${description}`,
            User:{
                connect:{
                    id: userData.id,
                },
            },
            Agency:{
                connect:{
                    id: foundAgencyId,
                },
            },
        },
    })
    }
}

export const createTeamUser = async (agencyId: string, user: User)=>{
    if(user.role==='AGENCY_OWNER') return null
    const response= await db.user.create({data:{ ...user }})
    return response
}

export const verifyAndAcceptInvitation = async () => {
    const user = await currentUser()
    if (!user) return redirect('/sign-in')
    const invitationExists = await db.invitation.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
        status: 'PENDING',
      },
    })
    if(invitationExists){
        const userDetails=await createTeamUser(invitationExists.agencyId,
            {
                email: invitationExists.email,
                agencyId: invitationExists.agencyId,
                avatarUrl: user.imageUrl,
                id: user.id,
                name: `${user.firstName}${user.lastName}`,
                role: invitationExists.role,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            await saveActivityLogsNotification({
                agencyId: invitationExists?.agencyId,
                description: `Joined`,
                subaccountId:undefined,
            })
            if(userDetails){
                await clerkClient.users.updateUserMetadata(user.id,{
                    privateMetadata:{
                        role: userDetails.role || "SUBACCOUNT_USER",
                    },
                })
                await db.invitation.delete({
                    where:{email: userDetails.email}
                })
                return userDetails.agencyId
            }
            else return null
    }else {
        const agency = await db.user.findUnique({where:{
            email:user.emailAddresses[0].emailAddress,
        },
    })
    return agency ? agency.agencyId: null
    }
    
}

export const updateAgencyDetails = async (agencyId:string,agencyDetails:Partial<Agency>)=>{
    const response= await db.agency.update({where:{id:agencyId},data:{...agencyDetails},})
    return response
}

export const deleteAgency = async (agencyId:string) => {
    const response = await db.agency.delete({where:{id:agencyId}})
    return response
}

export const initUser = async (newUser:Partial<User>)=>{
    const user= await currentUser();
    if(!user) return
    const userData = await db.user.upsert({
        where:{
            email:user.emailAddresses[0].emailAddress,
        },
        update:newUser,
        create:{
            id:user.id,
            avatarUrl:user.imageUrl,
            email:user.emailAddresses[0].emailAddress,
            name:`${user.firstName} ${user.lastName}`,
            role:newUser.role || 'SUBACCOUNT_USER',
        },
    })
    await clerkClient.users.updateUserMetadata(user.id,{
        privateMetadata:{
            role:newUser.role || "SUBACCOUNT_USER"
        },
    })
    return userData
}

export const upsertAgency = async (agency:Agency, price?: Plan)=>{
    if(!agency.companyEmail) return null
    try{
        const agencyDetails = await db.agency.upsert({
            where:{
                id:agency.id,
            },
            update:agency,
            create:{
                users:{
                    connect: {email:agency.companyEmail},
                },
                ...agency,
                SidebarOption:{
                    create:[
                        {
                            name: 'Dashboard',
                            icon: 'category',
                            link: `/agency/${agency.id}`,
                          },
                          {
                            name: 'Launchpad',
                            icon: 'clipboardIcon',
                            link: `/agency/${agency.id}/launchpad`,
                          },
                          {
                            name: 'Billing',
                            icon: 'payment',
                            link: `/agency/${agency.id}/billing`,
                          },
                          {
                            name: 'Settings',
                            icon: 'settings',
                            link: `/agency/${agency.id}/settings`,
                          },
                          {
                            name: 'Sub Accounts',
                            icon: 'person',
                            link: `/agency/${agency.id}/all-subaccounts`,
                          },
                          {
                            name: 'Team',
                            icon: 'shield',
                            link: `/agency/${agency.id}/team`,
                          },
                    ],
                },
            },
        })
        return agencyDetails
    } catch(error){
        console.log(error)
    }
}

export const getNotificationAndUser = async(agencyId: string) =>{
    try{
        const response = await db.notification.findMany({
            where:{agencyId},
            include:{User:true},
            orderBy:{
                createdAt:'desc',
            },
        })
        return response
    } catch(error){
        console.log(error)
    }
}

export const upsertSubAccount =async (subAccount:SubAccount) =>{
    if(!subAccount.companyEmail) return null
    const agencyOwner= await db.user.findFirst({
        where:{
            Agency:{
                id: subAccount.agencyId,
            },
            role:"AGENCY_OWNER",
        },
    })
    if(!agencyOwner) return console.log("Error, could not creatre subaccount")
    const permissionId=v4();
    const response = await db.subAccount.upsert({
        where:{id:subAccount.id},
        update:subAccount,
        create:{
            ...subAccount,
            Permissions:{
                create:{
                    access:true,
                    email:agencyOwner.email,
                    id:permissionId,
                },
                connect:{
                    subAccountId:subAccount.id,
                    id:permissionId,
                },
            },
            Pipeline:{
                create:{
                    name:"Lead Cycle"
                },
            },
            SidebarOption: {
                create: [
                  {
                    name: 'Launchpad',
                    icon: 'clipboardIcon',
                    link: `/subaccount/${subAccount.id}/launchpad`,
                  },
                  {
                    name: 'Settings',
                    icon: 'settings',
                    link: `/subaccount/${subAccount.id}/settings`,
                  },
                  {
                    name: 'Funnels',
                    icon: 'pipelines',
                    link: `/subaccount/${subAccount.id}/funnels`,
                  },
                  {
                    name: 'Media',
                    icon: 'database',
                    link: `/subaccount/${subAccount.id}/media`,
                  },
                  {
                    name: 'Pipelines',
                    icon: 'flag',
                    link: `/subaccount/${subAccount.id}/pipelines`,
                  },
                  {
                    name: 'Contacts',
                    icon: 'person',
                    link: `/subaccount/${subAccount.id}/contacts`,
                  },
                  {
                    name: 'Dashboard',
                    icon: 'category',
                    link: `/subaccount/${subAccount.id}`,
                  },
                ],
              },
        }
    })
    return response
}

export const getUserPermissions = async (userId: string) => {
    const response = await db.user.findUnique({
      where: { id: userId },
      select: { Permissions: { include: { SubAccount: true } } },
    })
  
    return response
  }

  export const updateUser = async (user: Partial<User>) => {
    const response = await db.user.update({
      where: { email: user.email },
      data: { ...user },
    })
  
    await clerkClient.users.updateUserMetadata(response.id, {
      privateMetadata: {
        role: user.role || 'SUBACCOUNT_USER',
      },
    })
  
    return response
  }

  export const changeUserPermissions = async (
    permissionId: string | undefined,
    userEmail: string,
    subAccountId: string,
    permission: boolean
  ) => {
    try {
      const response = await db.permissions.upsert({
        where: { id: permissionId },
        update: { access: permission },
        create: {
          access: permission,
          email: userEmail,
          subAccountId: subAccountId,
        },
      })
      return response
    } catch (error) {
      console.log('🔴Could not change persmission', error)
    }
  }

  export const getSubaccountDetails = async (subaccountId: string) => {
    const response = await db.subAccount.findUnique({
      where: {
        id: subaccountId,
      },
    })
    return response
  }

  export const deleteSubAccount = async (subaccountId:string) => {
    const response = await db.subAccount.delete({
      where: {
        id:subaccountId,
      }
    })
    return response
  }

  export const deleteUser = async (userId: string) => {
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        role: undefined,
      },
    })
    const deletedUser = await db.user.delete({ where: { id: userId } })
  
    return deletedUser
  }

  export const getUser = async (id: string) => {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    })
  
    return user
  }

  export const sendInvitation = async (
    role: Role,
    email: string,
    agencyId: string
  ) => {
    const resposne = await db.invitation.create({
      data: { email, agencyId, role },
    })
  
    try {
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: process.env.NEXT_PUBLIC_URL,
        publicMetadata: {
          throughInvitation: true,
          role,
        },
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  
    return resposne
}
  
export const getMedia = async (subaccountId:string) => {
  const mediaFiles = await db.subAccount.findUnique({
    where: {
      id:subaccountId
    },
    include:{ Media:true },
  })
  return mediaFiles
}

export const createMedia = async (subaccountId:string, mediaFile:CreateMediaType) => {
  const response = await db.media.create({
    data:{
      link:mediaFile.link,
      name:mediaFile.name,
      subAccountId:subaccountId,
    },
  })
  return response
}

export const deleteMedia = async (mediaId:string) => {
  const response = await db.media.delete({
    where:{
      id:mediaId
    }
  })
  return response
}

export const getPipelineDetails = async (pipelineId:string) => {
  const response = await db.pipeline.findUnique({
    where:{
      id:pipelineId,
    }
  })
  return response
}

export const getLanesWithTicketAndTags = async (pipelineId:string) => {
  const response = await db.lane.findMany({
    where:{
      pipelineId,
    },
    orderBy:{ order:'asc'},
    include:{
      Tickets:{
        orderBy:{order:'asc'},
        include:{
          Tags:true,
          Assigned:true,
          Customer:true
        },
      },
    }
  })
  return response
}

export const upsertFunnel = async (
  subaccountId: string,
  funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
  funnelId: string
) => {
  const response = await db.funnel.upsert({
    where: { id: funnelId },
    update: funnel,
    create: {
      ...funnel,
      id: funnelId || v4(),
      subAccountId: subaccountId,
    },
  })

  return response
}

export const upsertPipeline = async (
  pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput
) => {
  const response = await db.pipeline.upsert({
    where: { id: pipeline.id || v4() },
    update: pipeline,
    create: pipeline,
  })

  return response
}

export const deletePipeline = async (pipelineId:string) => {
  const response = await db.pipeline.delete({
    where:{
      id:pipelineId
    }
  })
  return response
}

export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({

        where: {
          id: lane.id,
        },
        data:{
          order:lane.order,
        },
      })
    );

    await db.$transaction(updateTrans)
    console.log("Done reordering")
  }
  catch(error) {
    console.log(error,"Error updating lane order")
  }
}

 export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    const updateTrans = tickets.map((ticket)=> 
      db.ticket.update({
        where: {
          id:ticket.id
        },
        data:{
          order: ticket.order,
          laneId: ticket.laneId,
        },
      })
    );

    await db.$transaction(updateTrans)
    console.log("Done Reordering")
  } catch(error) {
    console.log(error," Error updating ticket Order")
  }
 }

 export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
  let order: number
  if(!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        pipelineId:lane.pipelineId,
      },
    })

    order = lanes.length
  } else {
    order = lane.order
  }
  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order }
  })
  return response
 }

 export const deleteLane = async (laneId: string) => {
  const response = await db.lane.delete({
    where: {
      id:laneId,
    },
  })
  return response
 }

 export const getTicketsWithTags = async (pipelineId: string) => {
  const response = await db.ticket.findMany({
    where: {
      Lane: {
        pipelineId,
      },
    },
    include: { Tags: true, Assigned: true, Customer:true }
  })
  return response
 }

 //Not used
 export const _getTicketsWithAllRelations = async (laneId: string) => {
  const response = await db.ticket.findMany({
    where: {laneId:laneId},
    include: {
      Assigned:true,
      Customer: true,
      Lane: true,
      Tags: true,
    },
  })
  return response
 }

 export const getSubaccountTeamMembers = async (subaccountId: string) => {
  const subaccountUsersWithAccess = await db.user.findMany({
    where:{
      Agency:{
        SubAccount: {
          some: {
            id:subaccountId,
          },
        },
      },
    role: 'SUBACCOUNT_USER',
    Permissions: {
      some: {
        subAccountId: subaccountId,
        access:true
      }
    }
  }
  })
  return subaccountUsersWithAccess
 }

 export const searchContacts = async (searchTerms: string) => {
  const response = await db.contact.findMany({
    where: {
      name: {
        contains: searchTerms,
      },
    },
  })
  return response
 }

 export const upsertTicket = async (
  ticket: Prisma.TicketUncheckedCreateInput,
  tags: Tag[]
) => {
  let order: number
  if (!ticket.order) {
    const tickets = await db.ticket.findMany({
      where: { laneId: ticket.laneId },
    })
    order = tickets.length
  } else {
    order = ticket.order
  }

  const response = await db.ticket.upsert({
    where: {
      id: ticket.id || v4(),
    },
    update: { ...ticket, Tags: { set: tags } },
    create: { ...ticket, Tags: { connect: tags }, order },
    include: {
      Assigned: true,
      Customer: true,
      Tags: true,
      Lane: true,
    },
  })

  return response
}

export const deleteTicket = async (ticketId:string) => {
  const response = await db.ticket.delete({
    where:{
      id:ticketId
    },
  });
  return response
}

export const upsertTag = async (
  subaccountId: string,
  tag: Prisma.TagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), subAccountId: subaccountId },
    update: tag,
    create: { ...tag, subAccountId: subaccountId },
  })

  return response
}

export const getTagsForSubaccount = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: { Tags: true },
  })
  return response
}

export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } })
  return response
}

//funnel
export const getFunnels = async (subacountId: string) => {
  const funnels = await db.funnel.findMany({
    where: { subAccountId: subacountId },
    include: { FunnelPages: true },
  })

  return funnels
}

export const getFunnel = async (funnelId: string) => {
  const funnel = await db.funnel.findUnique({
    where: { id: funnelId },
    include: {
      FunnelPages: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  return funnel
}

export const updateFunnelProducts = async (
  products: string,
  funnelId: string
) => {
  const data = await db.funnel.update({
    where: { id: funnelId },
    data: { liveProducts: products },
  })
  return data
}

export const deleteFunnelePage = async (funnelPageId: string) => {
  const response = await db.funnelPage.delete({ where: { id: funnelPageId } })

  return response
}


export const upsertFunnelPage = async (
  subaccountId: string,
  funnelPage: UpsertFunnelPage,
  funnelId: string
) => {
  if (!subaccountId || !funnelId) return
  const response = await db.funnelPage.upsert({
    where: { id: funnelPage.id || '' },
    update: { ...funnelPage, updatedAt: new Date(), },
    create: {
      ...funnelPage,
      content: funnelPage.content
        ? funnelPage.content
        : JSON.stringify([
            {
              content: [],
              id: '__body',
              name: 'Body',
              styles: { backgroundColor: 'white' },
              type: '__body',
            },
          ]),
      funnelId,
    },
  })

  revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`, 'page')
  return response
}

export const getDomainContent = async (subDomainName: string) => {
  const response = await db.funnel.findUnique({
    where: {
      subDomainName,
    },
    include: { FunnelPages: true },
  })
  return response
}

export const getFunnelPageDetails = async (funnelPageId: string) => {
  const response = await db.funnelPage.findUnique({
    where: {
      id: funnelPageId,
    },
  })
  return response
}

export const getFunnelPageCode = async (funnelPageId: string) => {
  const response = await db.funnelPage.findUnique({
    where: {
      id: funnelPageId,
    },
  })

  if (!response || !response.content) return null;

  let parsedContent: any[];
  try {
    parsedContent = JSON.parse(response.content);
    if (!Array.isArray(parsedContent)) throw new Error("Invalid content format");
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }

  const converter = new JsonToHtmlConverter();
  const htmlOutput = converter.convert(parsedContent);
  console.log(htmlOutput);

  
  return htmlOutput
}

//code 1
/*const jsonToHtml = (data: any[]): string => {
  const processElement = (element: any): string => {
    const { styles, type, content } = element;
    const styleString = styles
      ? Object.entries(styles)
          .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}:${value}`)
          .join("; ")
      : "";

    let html = "";
    switch (type) {
      case "video":
        html = `<iframe src="${content?.src}" style="${styleString}" frameborder="0" allowfullscreen></iframe>`;
        break;
      case "text":
        html = `<p style="${styleString}">${content?.innerText || ""}</p>`;
        break;
      case "container":
        const childHtml = (content as any[]).map(processElement).join("");
        html = `<div style="${styleString}">${childHtml}</div>`;
        break;
      case "__body":
        const bodyHtml = (content as any[]).map(processElement).join("");
        html = `<body style="${styleString}">${bodyHtml}</body>`;
        break;
      default:
        html = `<div style="${styleString}">${JSON.stringify(content)}</div>`;
    }

    return html;
  };

  return data.map(processElement).join("");
};*/

interface StyleObject {
  [key: string]: string;
}

interface ElementContent {
  innerText?: string;
  src?: string;
  href?: string;
}

interface JsonElement {
  id?: string;
  name?: string;
  type: string;
  styles?: StyleObject;
  content?: ElementContent | JsonElement[] | any;
}

class JsonToHtmlConverter {
  private convertStylesToCss(styles?: StyleObject): string {
    if (!styles) return '';
    return Object.entries(styles)
      .map(([key, value]) => `${this.camelToKebabCase(key)}: ${value}`)
      .join('; ');
  }

  private camelToKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private processElement(element: JsonElement, indentLevel = 0): string {
    const { type, content, styles } = element;
    const styleString = this.convertStylesToCss(styles);
    const indent = '  '.repeat(indentLevel);

    switch (type) {
      case 'video': {
        const videoSrc = (content as ElementContent)?.src || '';
        return `${indent}<iframe src="${videoSrc}" style="${styleString}" frameborder="0" allowfullscreen></iframe>\n`;
      }

      case 'text': {
        const textContent = (content as ElementContent)?.innerText || '';
        return `${indent}<p style="${styleString}">${textContent}</p>\n`;
      }

      case 'link': {
        const linkContent = content as ElementContent;
        return `${indent}<a href="${linkContent?.href || '#'}" style="${styleString}">${linkContent?.innerText || 'Link'}</a>\n`;
      }

      case 'container':
      case '2Col': {
        const childrenContent = content as JsonElement[];
        const childrenHtml = childrenContent?.map(child => this.processElement(child, indentLevel + 1)).join('') || '';
        return `${indent}<div style="${styleString}">\n${childrenHtml}${indent}</div>\n`;
      }

      case '__body': {
        const bodyContent = content as JsonElement[];
        const bodyHtml = bodyContent?.map(child => this.processElement(child, indentLevel + 1)).join('') || '';
        return `<body style="${styleString}">\n${bodyHtml}</body>\n`;
      }
      case 'image': {
        const imageSrc = (content as ElementContent)?.src || '';
        return `${indent}<img src="${imageSrc}" style="${styleString}" frameborder="0" allowfullscreen></img>\n`;
      }
      default:
        return `${indent}<div style="${styleString}">${JSON.stringify(content)}</div>\n`;
    }
  }

  convert(jsonData: JsonElement[]): string {
    return jsonData.map(element => this.processElement(element, 1)).join('');
  }
}







//CODE TO JSON
{/*
interface ElementContent {
  innerText?: string;
  src?: string;
  href?: string;
}


interface JsonElement {
  id?: string;
  name?: string;
  type: string;
  styles?: StyleObject;
  content?: ElementContent | JsonElement[] | any;
}

class HtmlToJsonConverter {
  private counter = 0;

  private kebabToCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  private parseStyles(styleString: string): StyleObject {
    if (!styleString) return {};
    
    const styles: StyleObject = {};
    const styleArray = styleString.split(';').filter(style => style.trim());
    
    for (const style of styleArray) {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = this.kebabToCamelCase(property);
        styles[camelProperty] = value;
      }
    }
    
    return styles;
  }

  private generateId(prefix: string): string {
    this.counter++;
    return `${prefix}-${this.counter}`;
  }

  private getElementType(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    switch (tagName) {
      case 'p':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
      case 'span':
        return 'text';
      case 'a':
        return 'link';
      case 'img':
        return 'image';
      case 'iframe':
        return 'video';
      case 'div':
        if (element.classList.contains('two-column')) {
          return '2Col';
        }
        return 'container';
      case 'body':
        return '__body';
      default:
        return 'container';
    }
  }

  private getElementName(type: string): string {
    switch (type) {
      case 'text':
        return 'Text';
      case 'link':
        return 'Link';
      case 'image':
        return 'Image';
      case 'video':
        return 'YouTube Video';
      case '2Col':
        return 'Two Columns';
      case 'container':
        return 'Container';
      case '__body':
        return 'Body';
      default:
        return 'Container';
    }
  }

  private processElement(element: Element): JsonElement {
    const type = this.getElementType(element);
    const name = this.getElementName(type);
    const styles = this.parseStyles(element.getAttribute('style') || '');
    
    let content: ElementContent | JsonElement[] | undefined;
    
    switch (type) {
      case 'text':
        content = { innerText: element.textContent?.trim() || '' };
        break;
      
      case 'link':
        content = {
          innerText: element.textContent?.trim() || '',
          href: (element as HTMLAnchorElement).getAttribute('href') || '#'
        };
        break;
      
      case 'image':
        content = {
          src: (element as HTMLImageElement).getAttribute('src') || ''
        };
        break;
      
      case 'video':
        content = {
          src: (element as HTMLIFrameElement).getAttribute('src') || ''
        };
        break;
      
      default:
        const children = Array.from(element.children);
        if (children.length > 0) {
          content = children.map(child => this.processElement(child));
        }
    }

    return {
      id: element.id || this.generateId(type),
      name,
      type,
      styles,
      content
    };
  }

  convert(htmlString: string): string {
    try {
      const parser = new DOMParser();
      const root = parser.parseFromString(htmlString, 'text/html');
      const body = root.body;

      const jsonStructure = this.processElement(body);
      
      return JSON.stringify([jsonStructure]);
    } catch (error) {
      console.error('Error converting HTML to JSON:', error);
      return JSON.stringify([{
        id: '__body',
        name: 'Body',
        type: '__body',
        styles: {},
        content: []
      }]);
    }
  }
}

export default HtmlToJsonConverter;

const converter = new HtmlToJsonConverter();
const htmlExample = `
<body style="background-color: white;">
  <div style="text-align: center; width: 100%;">
    <p style="font-size: 64px; color: white; font-weight: bold;">Your Business Name</p>
  </div>
  <div class="two-column" style="display: flex;">
    <p style="font-size: 32px; color: black;">A Short Description of Your Business</p>
    <a href="#" style="color: white; background-color: blue; border-radius: 10px; padding: 10px 20px;">Get in Touch</a>
  </div>
</body>
`;

const jsonOutput = converter.convert(htmlExample);
console.log(jsonOutput);
*/}





//claude
export const upsertContact = async (
  contact: Omit<Prisma.ContactUncheckedCreateInput, 'id'> & { id?: string }
) => {
  const response = await db.contact.upsert({
    where: { 
      id: contact.id || v4() 
    },
    update: {
      name: contact.name,
      email: contact.email,
      subAccountId: contact.subAccountId // Changed from subaccountId to subAccountId
    },
    create: {
      name: contact.name,
      email: contact.email,
      Subaccount: {
        connect: {
          id: contact.subAccountId // The connect id can stay as is since it's just a reference
        }
      }
    }
  });

  return response;
};


export const getSubAccountWithContacts = async (subAccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: {
      id: subAccountId,
    },
    include: {
      Contact: {
        include: {
          Ticket: {
            select: {
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return response;
};


export const getAllTemplates = async () => {
  const response = await db.template.findMany({
    select: {
      name: true,
      content: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  return response;
};



//to check if already subscribed
export const isAgencySubscribed = async (agencyId: string) => {
  const subscription = await db.subscription.findUnique({
    where: { agencyId },
    select: { active: true },
  });

  return subscription?.active ?? false;
};



//create subscription
export const createOrUpdateSubscription = async (agencyId: string) => {
  try {
    const subscription = await db.subscription.upsert({
      where: { agencyId },
      update: {
        active: true,
        currentPeriodEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1-month validity
      },
      create: {
        agencyId,
        priceId: "price_123456", // Replace with actual price ID
        customerId: `cust_${agencyId}`, // Generate or fetch customer ID
        subscritiptionId: `sub_${agencyId}_${Date.now()}`, // Unique subscription ID
        currentPeriodEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1-month subscription
        active: true,
        price: "100", // Replace with actual price if needed
      },
    });

    return subscription;
  } catch (error) {
    console.error("Error updating/creating subscription:", error);
    throw new Error("Failed to update subscription");
  }
};


//payment status and alredy has subaccount
export const hasUnpaidSubAccount = async (agencyId: string): Promise<boolean> => {
  // First check if any subaccount exists
  const subAccountExists = await db.subAccount.findFirst({
    where: { agencyId },
    select: { id: true },
  });

  // If no subaccounts, always allow creating one (return false)
  if (!subAccountExists) return false;
  
  // Check if they have an active subscription
  const subscription = await db.subscription.findUnique({
    where: { agencyId },
    select: { active: true },
  });

  // Return true if they have a subaccount but no active subscription
  return !subscription?.active;
};




// Get total funnel pages for an entire agency
export const getAgencyTotalFunnelPages = async (agencyId: string) => {
  // First get all subaccounts for this agency
  const subaccounts = await db.subAccount.findMany({
    where: { agencyId },
    select: {
      id: true,
      name: true
    }
  });
  
  let totalAgencyPages = 0;
  const subaccountBreakdown = [];
  
  // For each subaccount, count its funnel pages
  for (const subaccount of subaccounts) {
    // Get all funnels for this subaccount
    const funnels = await db.funnel.findMany({
      where: { subAccountId: subaccount.id },
      select: {
        id: true
      }
    });
    
    const funnelIds = funnels.map(funnel => funnel.id);
    
    // Count pages for all funnels of this subaccount
    const subaccountPages = await db.funnelPage.count({
      where: {
        funnelId: {
          in: funnelIds
        }
      }
    });
    
    totalAgencyPages += subaccountPages;
    subaccountBreakdown.push({
      subaccountId: subaccount.id,
      name: subaccount.name,
      totalPages: subaccountPages
    });
  }
  
  return {
    agencyId,
    totalFunnelPages: totalAgencyPages,
    subaccountBreakdown
  };
};


// Get total funnel pages for a specific subaccount
export const getSubaccountTotalFunnelPages = async (subaccountId: string) => {
  // Get subaccount details
  const subaccount = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: {
      id: true,
      name: true,
      Agency: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  if (!subaccount) {
    throw new Error(`Subaccount with ID ${subaccountId} not found`);
  }
  
  // Count all funnel pages for this subaccount
  const totalPages = await db.funnelPage.count({
    where: {
      Funnel: {
        subAccountId:subaccountId
      }
    }
  });
  
  // Optional: Get breakdown by funnel
  const funnelBreakdown = await db.funnel.findMany({
    where: { subAccountId:subaccountId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          FunnelPages: true
        }
      }
    }
  });
  
  return {
    subaccountId,
    subaccountName: subaccount.name,
    agencyId: subaccount.Agency.id,
    agencyName: subaccount.Agency.name,
    totalFunnelPages: totalPages,
    funnelBreakdown: funnelBreakdown.map(funnel => ({
      funnelId: funnel.id,
      name: funnel.name,
      pageCount: funnel._count.FunnelPages
    }))
  };
};


// Function to get subaccount growth data
export const getSubaccountGrowthTrends = async (
  agencyId: string,
  timeframe: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
  limit: number = 12 // Default to last 12 periods
) => {
  // Get all subaccounts for this agency with their creation dates
  const subaccounts = await db.subAccount.findMany({
    where: { agencyId },
    select: {
      id: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (subaccounts.length === 0) {
    return { periods: [], counts: [] };
  }

  // Get earliest and latest dates
  const oldestDate = subaccounts[0].createdAt;
  const now = new Date();
  
  // Group subaccounts by period based on timeframe
  const periods: { label: string; count: number }[] = [];
  
  if (timeframe === 'weekly') {
    // Group by week
    const weekMap = new Map<string, number>();
    
    subaccounts.forEach(sa => {
      const date = sa.createdAt;
      // Get year and week number
      const year = date.getFullYear();
      const weekNum = getWeekNumber(date);
      const key = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      
      weekMap.set(key, (weekMap.get(key) || 0) + 1);
    });
    
    // Sort weeks and take the most recent 'limit' weeks
    const sortedWeeks = Array.from(weekMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit)
      .reverse();
    
    sortedWeeks.forEach(([week, count]) => {
      periods.push({ label: week, count });
    });
  } else if (timeframe === 'monthly') {
    // Group by month
    const monthMap = new Map<string, number>();
    
    subaccounts.forEach(sa => {
      const date = sa.createdAt;
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    });
    
    // Sort months and take the most recent 'limit' months
    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit)
      .reverse();
    
    sortedMonths.forEach(([month, count]) => {
      // Format as "Jan 2023", "Feb 2023", etc.
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        .toLocaleString('default', { month: 'short' });
      
      periods.push({ label: `${monthName} ${year}`, count });
    });
  } else if (timeframe === 'quarterly') {
    // Group by quarter
    const quarterMap = new Map<string, number>();
    
    subaccounts.forEach(sa => {
      const date = sa.createdAt;
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const key = `${year}-Q${quarter}`;
      
      quarterMap.set(key, (quarterMap.get(key) || 0) + 1);
    });
    
    // Sort quarters and take the most recent 'limit' quarters
    const sortedQuarters = Array.from(quarterMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit)
      .reverse();
    
    sortedQuarters.forEach(([quarter, count]) => {
      periods.push({ label: quarter, count });
    });
  } else if (timeframe === 'yearly') {
    // Group by year
    const yearMap = new Map<string, number>();
    
    subaccounts.forEach(sa => {
      const year = sa.createdAt.getFullYear().toString();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
    
    // Sort years and take the most recent 'limit' years
    const sortedYears = Array.from(yearMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, limit)
      .reverse();
    
    sortedYears.forEach(([year, count]) => {
      periods.push({ label: year, count });
    });
  }
  
  // Format for chart display
  return {
    periods: periods.map(p => p.label),
    counts: periods.map(p => p.count),
    total: subaccounts.length,
    averagePerPeriod: periods.length > 0 
      ? Math.round((subaccounts.length / periods.length) * 10) / 10 
      : 0
  };
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}