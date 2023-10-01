import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useBalance, useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits, formatEther } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "../../../abi/eTransferAbi";
import tokenAbi from "../../../abi/tokenAbi";
import { nanoid } from "nanoid";
import db from "../firebase.ts";
import { ref, update, set, onValue, get } from "firebase/database";
import { hashEmail, toFixedIfNecessary, numberWithCommas } from "../helperFunctions.ts";
import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Divider,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Box,
  Flex,
  Text,
  Spacer,
  Breadcrumb,
} from "@chakra-ui/react";
import { getRedirectResult } from "firebase/auth";
import { isCastable } from "../helperFunctions.ts";
import { ETRANSFER_ADDRESS, TOKEN_ADDRESS } from "../../../config";

type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

type Contact = {
  email: string;
  name: string;
};

function SendMoney() {
  const toast = useToast();
  const { user } = usePrivy();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();
  //   const { isOpen: isAddContactOpen, onOpen: onAddContactOpen, onClose: onAddContactClose } = useDisclosure();

  const { data: allowance, isLoading: isAllowanceLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "allowance",
    args: [activeWallet?.address as `0x${string}`, ETRANSFER_ADDRESS],
    enabled: typeof activeWallet !== "undefined",
    watch: true,
  });
  const { data: linkedEmail, isLoading: isLinkedEmailLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "linkedEmail",
    args: [activeWallet?.address as `0x${string}`],
    enabled: typeof activeWallet !== "undefined",
  });
  const { data: balance, isLoading: isBalanceLoading } = useContractRead({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [activeWallet?.address as `0x${string}`],
    watch: true,
  });

  const [destinationEmail, setDestinationEmail] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("0");

  const isSendAmountValid = sendAmount !== "" && sendAmount !== undefined && sendAmount !== null && parseFloat(sendAmount) > 0;
  const showSendAmountError = !isSendAmountValid  && sendAmount !== "0";

  const regex = new RegExp(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );

  const isDestinationEmailValid = regex.test(destinationEmail);
  const showDestinationEmailError = !isDestinationEmailValid && destinationEmail !== "";


  const { config: sendTransferConfig, refetch: refetchSendTransfer } = usePrepareContractWrite({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "sendTransfer",
    args: [hashEmail(destinationEmail.toLowerCase()), parseUnits(sendAmount, 18)],
    staleTime: 0,
    cacheTime: 0,
  });
  const { write: sendTransfer, data: sendTransferData, isLoading: isSendTransferLoading } = useContractWrite(sendTransferConfig);
  const { isLoading: isSendTransferWaitingForConf } = useWaitForTransaction({
    hash: sendTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  useEffect(() => {
    async function waitForRefetchSendTransfer() {
      await refetchSendTransfer();
    }
    waitForRefetchSendTransfer();
  }, [allowance]);

  async function handleSendTransfer() {
    const checkUserPath = ref(db, "users/" + hashEmail(destinationEmail));
    const snapshot = await get(checkUserPath);

    if (!snapshot.exists()) {
      // If user isn't linked, j temporarily add them
      const newUserPath = ref(db, "users/");
      const updates: { [key: string]: { email: string; address: string; name: string } } = {};
      updates[hashEmail(destinationEmail)] = { email: destinationEmail, address: "", name: "" };
      update(newUserPath, updates);
    }
    sendTransfer?.();
  }

  const { config: approveConfig } = usePrepareContractWrite({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "approve",
    args: [ETRANSFER_ADDRESS, BigInt(2) ** BigInt(256) - BigInt(1)],
  });
  const { write: approve, data: approveData, isLoading: isApproveLoading } = useContractWrite(approveConfig);
  const { isLoading: isApproveWaitingForConf } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const { data: ethBalance } = useBalance({ address: activeWallet?.address as `0x${string}`, watch: true });

  const { config: mintConfig } = usePrepareContractWrite({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "mint",
    args: [activeWallet?.address as `0x${string}`, parseUnits("5", 18)],
  });
  const { write: mint, data: mintData, isLoading: isMintLoading } = useContractWrite(mintConfig);
  const { isLoading: isMintWaitingForConf } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const {
    write: cancelTransfer,
    data: cancelTransferData,
    isLoading: isCancelTransferLoading,
  } = useContractWrite({ address: ETRANSFER_ADDRESS, abi: eTransferAbi, functionName: "cancelTransfer" });
  const { isLoading: isCancelTransferWaitingForConf } = useWaitForTransaction({
    hash: cancelTransferData?.hash,
    onSuccess(data) {
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  const [depositModalChoice, setDepositModalChoice] = useState<string>();
  //   const [addContactModalEmail, setAddContactModalEmail] = useState<string>("");
  //   const [addContactModalName, setAddContactModalName] = useState<string>("");
  const allUserAccounts: string[] = [];

  user?.linkedAccounts.forEach((account) => {
    if (account.type === "wallet") {
      allUserAccounts.push(account.address);
    }
  });
  const [name, setName] = useState<string>("");
  //   const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    return onValue(ref(db, "users/" + hashEmail(user?.email?.address!)), (snapshot) => {
      const data = snapshot.val();
      const name: string = data.name;

      setName(name);
    });
  }, []);

  //   useEffect(() => {
  //     return onValue(ref(db, "users/" + hashEmail(user?.email?.address!) + "/contacts/"), (snapshot) => {
  //       const data = snapshot.val();

  //       const contacts: Contact = data;
  //       console.log(data);
  //       console.log("contact:");
  //       console.log(contacts);
  //       console.log("users/" + hashEmail(user?.email?.address!) + "/contacts/");

  //       //   setContacts(contacts && contacts.length > 0 ? contacts : []);
  //     });
  //   }, []);

  const [isSendTransferDisabled, setIsSendTransferDisabled] = useState<boolean>(false);
  useEffect(() => {
    if (allowance !== null && allowance !== undefined && allowance < parseUnits(sendAmount, 18)) {
      setIsSendTransferDisabled(true);
    } else {
      setIsSendTransferDisabled(false);
    }
  }, [allowance, sendAmount]);

  const { wallets } = useWallets();

  return (
    <Flex direction={"column"}>
      {/* <Modal isOpen={isAddContactOpen} onClose={onAddContactClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add contact</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Text fontWeight={"regular"} fontSize={"sm"} mb={"8px"}>
              Name
            </Text>
            <Input
              value={addContactModalName}
              onChange={(e) => setAddContactModalName(e.target.value)}
              placeholder="John Doe"
              size={"sm"}
              width={"100%"}
              height={"50px"}
              mb={"16px"}
            />

            <Text fontWeight={"regular"} fontSize={"sm"} mb={"8px"}>
              Email
            </Text>
            <Input
              value={addContactModalEmail}
              onChange={(e) => setAddContactModalEmail(e.target.value)}
              placeholder="john.doe@example.com"
              size={"sm"}
              width={"100%"}
              height={"50px"}
            />
          </ModalBody>

          <ModalFooter>
            <Button backgroundColor={"brand"} onClick={onAddContactClose}>
              Add Contact
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal> */}
      <Flex direction={"column"} px={"16px"} py={"8px"}>
        <Text fontWeight={"regular"} fontSize={"sm"}>
          Logged into e-Transfer®
        </Text>
      </Flex>
      <Flex direction={"column"} padding={"16px"} backgroundColor={"gray.50"}>
        <Text fontWeight={"medium"} fontSize={"lg"}>
          {name.toUpperCase()}
        </Text>

        <Text fontWeight={"normal"} fontSize={"md"}>
          {user?.email?.address!}
        </Text>
      </Flex>

      <Flex direction={"column"} padding={"16px"} gap="8px">
        <Flex direction={"row"} justifyContent={"space-between"}>
          <Text fontWeight={"regular"} fontSize={"sm"}>
            From Account
          </Text>
          <Button variant={"link"} fontWeight={"regular"} fontSize={"sm"}>
            + Link Account
          </Button>
        </Flex>

        <Flex direction={"row"} gap={"20px"} alignItems={"center"}>
          <Select>
            {wallets.map((wallet) => {
              if (user?.wallet?.address === wallet.address) {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    e-Transfer® wallet
                  </option>
                );
              } else {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.address}
                  </option>
                );
              }
            })}
          </Select>

          <Flex direction="column" flexShrink={0}>
            <Text fontWeight={"regular"} fontSize={"md"}>
              ${balance ? numberWithCommas(formatUnits(balance, 18)) : "0.00"}
            </Text>
            <Text fontWeight={"regular"} fontSize={"xs"}>
              ETH: {ethBalance ? toFixedIfNecessary(ethBalance?.formatted, 5) : "0.00"}
            </Text>
          </Flex>
        </Flex>

        {user?.wallet?.address == activeWallet?.address && (
          <Text fontWeight={"regular"} textColor={"gray.500"} fontSize={"xs"}>
            Crypto Address: {activeWallet?.address}
          </Text>
        )}

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"}>
          <Text fontWeight={"regular"} fontSize={"sm"}>
            To
          </Text>
          {/* <Button variant={"link"} onClick={onAddContactOpen} fontWeight={"regular"} fontSize={"sm"}>
            + Add Contact
          </Button> */}

          {/* input email */}
        </Flex>
        <FormControl isInvalid={showDestinationEmailError}>
          <Input value={destinationEmail} placeholder="Recipient's email" onChange={(e) => setDestinationEmail(e.target.value)}></Input>
          {showDestinationEmailError && <FormErrorMessage>Invalid Email</FormErrorMessage>}
        </FormControl>

        {/* 
        <Select>
          {contacts.map((contact) => {
            return (
              <option key={contact.email} value={contact.email}>
                {contact.name} \({contact.email}\)
              </option>
            );
          })}
        </Select> */}

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"}>
          <Flex direction={"column"}>
            <Text fontWeight={"regular"} fontSize={"sm"}>
              Amount
            </Text>

            <Flex alignItems={"center"}>
              <Button
                variant={"link"}
                onClick={mint}
                fontWeight={"regular"}
                isDisabled={
                  isApproveLoading || isApproveWaitingForConf || isSendTransferLoading || isSendTransferWaitingForConf || isMintWaitingForConf || isMintLoading
                }
                fontSize={"xs"}
              >
                + Mint Test USDC
              </Button>
              {isMintWaitingForConf || (isMintLoading && <Spinner ml="8px" color={"gray.400"} size={"xs"} />)}
            </Flex>
          </Flex>

          <Flex direction={"row"} alignItems={"center"}>
            <Text fontWeight={"regular"} fontSize={"xl"} mr={"5px"}>
              $
            </Text>
            <FormControl isInvalid={showSendAmountError}>
              <NumberInput value={sendAmount} onChange={(newVal) => setSendAmount(newVal)} size={"sm"} width={"150px"}>
                <NumberInputField />
              </NumberInput>

              {showSendAmountError && <FormErrorMessage position={"absolute"}>Invalid Amount</FormErrorMessage>}
            </FormControl>
          </Flex>
        </Flex>
        {showSendAmountError && <Spacer mb={"8px"} />}

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        {typeof allowance === "bigint" && allowance < parseUnits(sendAmount, 18) && (
          <Button isLoading={isApproveLoading || isApproveWaitingForConf} height={"50px"} onClick={approve}>
            Approve USDC
          </Button>
        )}

        <Button
          isDisabled={isSendTransferDisabled || isDestinationEmailValid === false || isSendAmountValid === false}
          isLoading={isSendTransferWaitingForConf || isSendTransferLoading}
          colorScheme={"brand"}
          textColor={"black"}
          height={"50px"}
          onClick={handleSendTransfer}
        >
          Send money
        </Button>
      </Flex>
    </Flex>
  );
}

export default SendMoney;
