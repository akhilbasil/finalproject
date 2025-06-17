'use client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getAuthUserDetails, hasUnpaidSubAccount } from "@/lib/queries";
import { SubAccount } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import DeleteButton from "./_components/delete-button";
import CreateSubaccountButton from "./_components/create-subaccount-btn";
import { useRouter } from "next/navigation";



type Props = {
    params:{agencyId:string}
}

const AllSubaccounts= async ({params}: Props) => {
    const [user, setUser] = useState<any>(null);
    const [hasUnpaid, setHasUnpaid] = useState<boolean>(false);
    
    const router = useRouter();
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await getAuthUserDetails();
                setUser(userData);
                if (userData) {
                    const unpaidStatus = await hasUnpaidSubAccount(params.agencyId);
                    setHasUnpaid(unpaidStatus);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [params.agencyId]);

    if(!user) return
    const handlePayment = () => {
        router.push(`/agency/${params.agencyId}/billing`);
      };
      
    return(
        <AlertDialog>
            <div className="flex flex-col ">
            {hasUnpaid ? (
                    <div className="w-[250px] self-end m-6">
                        <Button className="w-full" onClick={handlePayment}>Pay to get more Subaccounts</Button>
                    </div>
                ) : (
                    <CreateSubaccountButton user={user} id={params.agencyId} className="w-[200px] self-end m-6" />
                )}
                <Command className="rounded-lg bg-transparent">
                    <CommandInput placeholder="Search Account"/>
                    <CommandList>
                        <CommandEmpty>No results Found</CommandEmpty>
                        <CommandGroup heading="Sub Accounts">
                            {!!user.Agency?.SubAccount?.length ? user.Agency.SubAccount.map(
                            (subaccount:SubAccount) => (
                                <CommandItem key={subaccount.id} className="h-32 !bg-background my-2 text-primary border-[1px] border-border p-4 rounded-lg hover:!bg-background cursor-pointer transition-all">
                                    <Link href={`/subaccount/${subaccount.id}`} className="flex gap-4 w-full h-full pointer-events-auto" >
                                        <div className="relative w-32">
                                            <Image src={subaccount.subAccountLogo} alt="Subaccount Logo" fill className="rounded-md object-contain bg-muted/50 p-4"/>
                                        </div>
                                        <div className="flex flex-col justify-between">
                                            <div className="flex flex-col">
                                                {subaccount.name}
                                                <span className="text-muted-foreground text-xs">{subaccount.address}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <AlertDialogTrigger asChild>
                                        <Button size={'sm'} variant={'destructive'} className="text-red-600 w-20 hover:bg-red-600 hover:text-white pointer-events-auto">Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-left">Are you sure to delete?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-left">This action is irreversible, subaccount will be deleted</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flext-items-center">
                                            <AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive" >
                                                <DeleteButton subaccountId={subaccount.id}/>
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </CommandItem>
                            )
                            ) : <div className="text-muted-foreground text-center p-4">No Subaccounts</div> }
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </AlertDialog>
    )
}

export default AllSubaccounts;